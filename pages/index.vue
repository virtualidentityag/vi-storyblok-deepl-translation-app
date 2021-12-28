<template >
	<div class='fontStyle' v-if="!loadingContext">
		<el-row v-if="!languagesAvailable">
			<el-alert
				title="No languages found"
				type="error"
				description= "Please setup field level translation and add languages to use the application. 
				For more info visit: https://www.storyblok.com/docs/guide/in-depth/internationalization"
				show-icon
				:closable="false">
			</el-alert>
		</el-row>
		<el-row v-if="languagesAvailable">
			<p>Content will be translated from: {{ getlangName(currentLanguage) }}</p>
			
			<el-row>
				<p>Translate Into: (required)</p>

				<el-checkbox-group v-for="locale in availableLanguages" :disabled='invalidKey' :key="locale.lang" v-model="requestedLanguages">
					<el-checkbox :label="locale.lang"> {{getAvailableLanguagesName(locale.lang)}} </el-checkbox>
				</el-checkbox-group>
			</el-row>

			<el-row>
				<el-button v-on:click="sendTranslationRequest" :disabled='invalidKey' type="primary" size="mini">Translate Content</el-button>
			</el-row>
		</el-row>
		
		<el-row v-if="invalidKey">
			<el-alert
				title="Invalid key. Please enter a valid DeepL api key"
				type="error"
				description='Please enter a valid DeepL api key in the Datasources. Follow the steps as follows:
				  Go back to the dashboard of your space
				> Select Datasources from sidebar
				> Select Datasource with name "Api Key from DeepL" 
				> Replace "Enter-Api-Key-Here" with your Api Key 
				> Click save button, second from left.'
				show-icon
				:closable="false">
			</el-alert>
		</el-row>
		<!-- <p>Checked {{requestedLanguages}}</p> -->
	</div>
</template>

<script>
	import { Notification } from 'element-ui';
	import { deepLTranslate } from './../utils/deepl-services'
	import { fetchStory, createDataSource, createDataSourceEntry, updateStory, fetchDataSources } from '../utils/services'
	import { languageCodes } from './../utils/language-codes'
	import Storyblok from "./../utils/Storyblok-config";

	export default {
		data() {
			return {
				story: undefined,
				loadingContext: true,
				invalidKey: true,
				languagesAvailable: false,
				currentLanguage: "",
				apiKey: "",
				availableLanguages: [],
				requestedLanguages: [],
			};
		},

		mounted() {
			
			if (window.top === window.self) {
				window.location.assign("https://app.storyblok.com/oauth/tool_redirect");
			}

			window.addEventListener("message", this.processMessage, false);

			//Use getContext to get the current story
			window.parent.postMessage(
				{
					action: "tool-changed",
					tool: "virtual-identity-ag@auto-translations-app",
					event: "getContext",
				},
				"https://app.storyblok.com"
			);

			// Use heightChange to change the height of the tool
			window.parent.postMessage(
				{
					action: "tool-changed",
					tool: "virtual-identity-ag@auto-translations-app",
					event: "heightChange",
					height: 500,
				},
				"https://app.storyblok.com"
			);

			this.fetchDataSourceEntries()
		},

		methods: {
			// to get the current story once app is loaded
			processMessage(event) {
				console.log('event outside', event)
				if (event.data && event.data.action == "get-context") {
					console.log('event', event)
					this.loadingContext = false;
					this.story = event.data.story;
					this.currentLanguage = event.data.language !== "" ? event.data.language : "Default Language";
					
					if(event.data.story.localized_paths.length > 0){
						this.languagesAvailable = true
						this.availableLanguages = Array.from(event.data.story.localized_paths);
					}

				}
			},

			// return language name for the given code
			getlangName(langCode){
				if(langCode !== "Default Language")
					return languageCodes.find(lang => lang.code === langCode).name
				else
					return langCode
			},

			getAvailableLanguagesName(code){ return code + " - " + this.getlangName(code);},
			
			//fetch api key saved in data entries, if not then it creates an entry
			async fetchDataSourceEntries() {
				let entry = await Storyblok.get(`spaces/${this.$route.query.space_id}/datasource_entries`, {
									"datasource_slug": "deepl-api-key"
							})
							.then(response => {
								return response;
							}).catch(error => { 
								console.log(error)
							})
							
				if(!entry){
					let dataSource = await createDataSource(this.$route.query.space_id);
					
					if(dataSource){
						let newEntry = await createDataSourceEntry(this.$route.query.space_id,dataSource.data.datasource.id)
						
						if(newEntry)
							this.apiKey = newEntry.data.datasource_entry
						else
							return false;
					}
				}
				else{
					let key = entry.data.datasource_entries.find(element => element.name === "Deepl-Api-key")

					if(key){
						if(key.value !== "Enter-Api-Key-Here"){
							this.apiKey = key.value;
							this.invalidKey = false;
						}
						else
							this.invalidKey = true;
					}
					else{
						let datasource = await fetchDataSources(this.$route.query.space_id)

						if(datasource){
							let dataSourceId = datasource.data.datasources.find(element => element.slug === "deepl-api-key").id
							let newEntry = await createDataSourceEntry(this.$route.query.space_id,dataSourceId)
							
							if(newEntry)
								this.apiKey = newEntry.data.datasource_entry
							else
								return false;
						}
						
						this.invalidKey = true;

					}
				}
			},

			
			transformLanguageString(languageString){
				const splittedString = languageString.split('-')
				return splittedString.reduce((previousValue, currentValue) => previousValue.trim() + '_' + currentValue.trim())
			},

			generateXML(obj){
				let str = ''

				for(let key in obj){
					str+= `${'<'+[key]+'>'+[obj[key]]+'</'+[key]+'>'}`
				}

				return str;
			},
			convertXMLToJSON(xml,extractedFields){
				let obj = {}

				for (let key in extractedFields) {
					
					let _key = xml.substring(xml.indexOf('<')+1, xml.indexOf('>'))
					let _value = xml.substring(xml.indexOf('>')+1, xml.indexOf('</'))

					xml = xml.substring(xml.indexOf('><')+1, xml.length)

					let removed = JSON.stringify(_value).replace(`"\"`,`"`)
					    removed = removed.replace(`\""`,`"`)

					Object.assign(obj,{[_key]: _value})
				}

				return obj;
			},

			// extracts the fields from story object with the help of story json returned by export.json api
			extractingFields(storyJson,storyObject) {
				let translatableContents = {};

				let languageStr = this.currentLanguage === "Default Language" ? "" : `__i18n__${this.transformLanguageString(this.currentLanguage)}`

				for (let keys in storyJson) {
					let extracted = keys.split(":"); // splitting e.g {4e272c60-a59e-4c1d-b7bc-115b920588e6:button:text: "Call to action"} in 3 parts
					let extractedContent = [];
					let keyBackUp = ""
					
					if (extracted.length > 1 ) {
						
						extractedContent = Array.from(storyObject.content.body) 

						do{
						
							let existsInKeyName = ""

							if(keyBackUp !== "")
								extractedContent = extractedContent[keyBackUp]

							
							extractedContent = extractedContent.reduce((previousValue, currentValue) => {
								if(JSON.stringify(previousValue).includes(extracted[0])) return previousValue; //determining in which obj the _uid is present
								else return currentValue
							})

							if(extractedContent.component !== extracted[1]){ //checking if we are in the correct obj, extracted¢[1] includes the name of the component
								for(let _keys in extractedContent){
									if(JSON.stringify(extractedContent[_keys]).includes(extracted[1])){ //determining if the object is further nested where out content is present
										existsInKeyName = _keys;											//and the name of the key in which it is present
										break;
									}
								}
							}

							if(!Array.isArray(extractedContent[existsInKeyName]) && typeof extractedContent[existsInKeyName] === 'object' ) //if the key is the type of object {}
								if(extractedContent._uid == extracted[0] && extractedContent.component ==  extracted[1])
									break;

							if(extractedContent._uid == extracted[0]) //if _uid has been matched, copy the value of 2nd index to 1st since extracted[0] is being used above
								extracted[0] = extracted[1]

							keyBackUp = existsInKeyName //creating a backup of existsInKeyName
							
						}while(extractedContent.component !==  extracted[1]) //loop until component name is not matched
						
						
						if (extractedContent) {
							Object.assign(translatableContents, { [`${keys}`]: extractedContent[`${extracted[2]}${languageStr}`] }); // creating an object of translatable fields
						}
					}
				}

				return translatableContents
			},


			// storyJsonWithLang only contains the translatable fields
			// both objects are being compared and key which are not present in storyJsonWithLang are being removed from storyJson
			removeUnwanted(storyJson, storyJsonWithLang){
				let newStoryJson = {}

				for(let keyOfStoryJson in storyJson){
					if(storyJsonWithLang.hasOwnProperty(keyOfStoryJson)){
						Object.assign(newStoryJson, {[keyOfStoryJson]: JSON.stringify(storyJson[keyOfStoryJson])})
					}
				}

				return newStoryJson
			},

			async sendTranslationRequest() {
				if(this.requestedLanguages.length > 0){ 
					
					let updatedStory = await fetchStory(this.$route.query.space_id,this.story.id, this.availableLanguages[0].lang);
					let storyObject = updatedStory.storyObj
					let storyJson = this.removeUnwanted(updatedStory.storyJSON,  updatedStory.storyJSONWithLang)
					let extractedFields = {...this.extractingFields(storyJson, storyObject)}
					let sourceLanguage = this.currentLanguage !== "Default Language" ? this.currentLanguage.split("-")[0].toUpperCase() : ""
					let extractedFieldsXML = this.generateXML(extractedFields) 					// converting json to xml
					
					// console.log('extractedFields', extractedFields);
					// console.log("extractedXML", extractedFieldsXML)
					
					this.requestedLanguages.forEach(async (requestedLanguage) => {
						const response = await deepLTranslate(
											extractedFieldsXML, requestedLanguage.split("-")[0].trim(),
											sourceLanguage, this.apiKey,
										);

						if (response) {
							
							let convertedXml = {
								...this.convertXMLToJSON(response.translations[0].text, extractedFields), 
								language: requestedLanguage,
								page: this.story.id+"",
								text_nodes: JSON.parse(storyJson.text_nodes),
								url: JSON.parse(storyJson.url)
							}
							
							// console.log('converted xml', convertedXml)
							storyObject = await updateStory( this.$route.query.space_id, this.story.id, JSON.stringify(convertedXml),requestedLanguage);
						
							if(storyObject)
								this.successMessage();
							else
								this.errorMessage(requestedLanguage)
						}
					});
				}
				else
					this.languageErrorMessage();
			},
			successMessage() {
				Notification({
				title: 'Success',
				message: 'Translation Successful!',
				type: 'success',
				});
			},
			languageErrorMessage() {
				Notification({
				title: 'Error',
				message: 'Please select atleast one target language',
				type: 'error',
				});
			},
			errorMessage(lang){
				Notification({
				title: 'Error',
				message: `Error occurred for language ${this.getlangName(lang)}. Please try again later.`,
				type: 'error',
				duration:20000
				});
			}
		},
	};
</script>

<style>
  .el-row {
    margin-bottom: 20px;
  }
  .el-row:last-child {
      margin-bottom: 0;
  }
  .fontStyle{
	  font-family: sans-serif;
  }
  .el-notification__title {
    font-weight: 700;
    font-size: 16px;
    color: #303133;
    margin: 0;
    font-family: sans-serif;
  }
  .el-notification__content {
    font-size: 14px;
    line-height: 21px;
    margin: 6px 0 0;
    color: #606266;
    text-align: justify;
    font-family: sans-serif;
  }
  .el-notification {
    display: flex;
    width: 270px;
    padding: 14px 26px 14px 13px;
    border-radius: 8px;
    box-sizing: border-box;
    border: 1px solid #EBEEF5;
    position: fixed;
    background-color: #FFF;
    box-shadow: 0 2px 12px 0 rgb(0 0 0 / 10%);
    transition: opacity .3s,transform .3s,left .3s,right .3s,top .4s,bottom .3s;
    overflow: hidden;
  }
  p{
	font-size: smaller;
  }
</style>