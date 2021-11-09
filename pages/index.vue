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
				<p>Translate Into</p>

				<el-checkbox-group v-for="locale in availableLanguages" :key="locale.lang" v-model="requestedLanguages">
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
	import xml2js from "xml2js";
	import { Notification } from 'element-ui';
	import { deepLTranslate } from './../utils/deepl-services'
	import { fetchStory, createDataSource, createDataSourceEntry, updateStory, fetchDataSources } from './../utils/utilities'
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
			console.log('Mounted!!')
			// this.editorEvents()
			
			if (window.top === window.self) {
				window.location.assign("https://app.storyblok.com/oauth/tool_redirect");
			}

			window.addEventListener("message", this.processMessage, false);

			// Use getContext to get the current story
			window.parent.postMessage(
				{
					action: "tool-changed",
					tool: "virtual-identity-ag@example-tool-app",
					event: "getContext",
				},
				"https://app.storyblok.com"
			);

			// Use heightChange to change the height of the tool
			window.parent.postMessage(
				{
					action: "tool-changed",
					tool: "virtual-identity-ag@example-tool-app",
					event: "heightChange",
					height: 500,
				},
				"https://app.storyblok.com"
			);

			this.fetchDataSourceEntries()
		},

		methods: {
		
			editorEvents(){
				const storyblokInstance = new window.StoryblokBridge()
 
				storyblokInstance.on('input', (payload) => {
					console.log('Content changed', payload.story.content)
				// Handle re-rendering
				})
				
				storyblokInstance.on('change', (payload) => {
				// Load draft version of story
				})
				
				// Call ping editor to see if in editor
				storyblokInstance.pingEditor(() => {
					if (storyblokInstance.isInEditor()) {
						// Load draft version of story
						console.log('draft')
					} else {
						// Load published version of story
						console.log('published')
					}
				})
			},
			processMessage(event) {
				console.log('event outside', event)
				if (event.data && event.data.action == "get-context") {
					console.log('event', event)
					this.loadingContext = false;
					this.story = event.data.story;
					this.currentLanguage = event.data.language !== "" ? event.data.language : "Default Language";
					// this.currentLanguage = event.data.language !== "" ? event.data.language : "EN-EN";

					
					if(event.data.story.localized_paths.length > 0){
						this.languagesAvailable = true
						this.availableLanguages = Array.from(event.data.story.localized_paths);
					}

					console.log("event.data.story.localized_paths", event.data.story.localized_paths);
					console.log("story", event.data.story);
					console.log(".data", event.data.language);
				}
			},

			getlangName(langCode){
				if(langCode !== "Default Language")
					return languageCodes.find(lang => lang.code === langCode).name
				else
					return langCode
			},

			getAvailableLanguagesName(code){ return code + " - " + this.getlangName(code);},
			
			getRoute(){ 
				console.log('this.$route ', window.location)
			},

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
					console.log('key', key, entry);

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
							console.log('DataSource', datasource)

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
				console.log('splitteedString', splittedString, languageString)
				return splittedString.reduce((previousValue, currentValue) => previousValue.trim() + '_' + currentValue.trim())
			},

			extractingFields(storyJson,storyObject) {
				let splitArray = [];

				for (let keys in storyJson) {
					let extracted = keys.split(":");
					let splitStr = "";
					console.log('length = ', extracted.length, extracted)
					// if (extracted.length > 1 && extracted.length < 4) {

						splitStr = JSON.stringify(storyObject).slice(JSON.stringify(storyObject).indexOf(extracted[0]));

					
						if (splitStr.indexOf(extracted[1]) < splitStr.indexOf(extracted[2])) {
							splitStr = splitStr.slice(splitStr.indexOf(`"${extracted[1]}"`));
							splitStr = splitStr.slice(splitStr.indexOf(`"${extracted[2]}"`));
						} 
						else 
							splitStr = splitStr.slice(splitStr.indexOf(`"${extracted[2]}":"${storyJson[keys]}"`));

						splitStr = splitStr.match(/[^\[](.*)[^\]]/g);

						if (splitStr) {
							console.log('splitStr!!!!!!!', splitStr);
							splitStr 	 = splitStr.toString().split(`,"`);
							let strKey 	 = splitStr[0].substring(0, splitStr[0].indexOf(":"));
							let strValue = splitStr[0].substring( splitStr[0].indexOf(":") + 1);
							console.log('strKey', strKey);
							console.log('strValue', strValue);
							splitArray.push({ [JSON.parse(strKey)]: JSON.parse(strValue) });
						}
					// }
				}

				return splitArray
			},

			updatingStoryContents(storyJson, storyObject, requestedLanguage, translatedJson){
				let splitingResponse = "";
				let firstHalfStr = "";
				let secondHalfStr = "";
				let fullStr = '';
				let translatedStoryObj = JSON.stringify(storyObject)

				for (let keys in storyJson) {
					let extracted = keys.split(":");

					if (extracted.length > 1 ) {

						splitingResponse = translatedStoryObj.split(`"${extracted[0]}"`);
						
						firstHalfStr  = splitingResponse[1].substring(0,splitingResponse[1].indexOf(`"${extracted[2]}":"${storyJson[keys]}"`));
						secondHalfStr = splitingResponse[1].substring( splitingResponse[1].indexOf(`"${extracted[2]}":"${storyJson[keys]}"`));
					
						if (JSON.stringify(secondHalfStr).includes(`${extracted[2]}__i18n__${this.transformLanguageString(requestedLanguage)}`)) {
							secondHalfStr = secondHalfStr.replace(`"${extracted[2]}__i18n__${this.transformLanguageString(requestedLanguage)}"`,
																`"${extracted[2]}__i18n__XXXX${this.transformLanguageString(requestedLanguage)}"`)
						}

						for (let keys in translatedJson.root) {
							
							if (keys.localeCompare(extracted[2]) === Number(0)) {
								let value =  translatedJson.root[keys][0];
								let newObj = `"${keys}__i18n__${this.transformLanguageString(requestedLanguage)}":${JSON.stringify(value)}`;

								if(value.startsWith('"') && value.endsWith('"'))
									newObj = `"${keys}__i18n__${this.transformLanguageString(requestedLanguage)}":"\\${value}`; 
								
								fullStr = splitingResponse[0].concat(`"${extracted[0]}"`);
							
								if(!fullStr.endsWith(',')){
									fullStr = fullStr.concat(",");
									
									if(firstHalfStr.startsWith(','))
										firstHalfStr = firstHalfStr.substring(1);
								}

								fullStr = fullStr.concat(firstHalfStr);
								fullStr = fullStr.concat(newObj);

								if(!fullStr.endsWith(',')){
									fullStr = fullStr.concat(",")

									if(secondHalfStr.startsWith(','))
										secondHalfStr = secondHalfStr.substring(1);
								}

								fullStr = fullStr.concat(secondHalfStr);

								if (translatedJson.root[keys].length > 1) translatedJson.root[keys].splice(0,1);
								
								translatedStoryObj = fullStr;
							}
						}
					}
				}	

				return translatedStoryObj;
			},

			removeUnwanted(storyJson, storyJsonWithLang){
				let newStoryJson = {}

				for(let keyOfStoryJson in storyJson){
					if(storyJsonWithLang.hasOwnProperty(keyOfStoryJson)){
						Object.assign(newStoryJson, {[keyOfStoryJson]: storyJson[keyOfStoryJson]})
					}
				}

				return newStoryJson
			},

			async sendTranslationRequest() {
				if(this.requestedLanguages.length > 0){
					let json = "";
					// let updatedStory = await this.fetchStory();
					let updatedStory = await fetchStory(this.$route.query.space_id,this.story.id, this.availableLanguages[0].lang);
					let storyObject = updatedStory.storyObj
					let storyJson = this.removeUnwanted(updatedStory.storyJSON,  updatedStory.storyJSONWithLang)
					let extractedFields = [];
					let sourceLanguage = this.currentLanguage !== "Default Language" ? this.currentLanguage.split("-")[0].toUpperCase() : ""
	
					console.log('storyJSON', storyJson);
					extractedFields = Array.from(this.extractingFields(storyJson, storyObject))
					console.log('extractedFields', extractedFields);

					let builder = new xml2js.Builder();
					// let extractedFieldsXML = builder.buildObject(extractedFields);
					let extractedFieldsXML = builder.buildObject(JSON.parse(JSON.stringify(extractedFields)));
					
					console.log('source', sourceLanguage, this.currentLanguage)
					console.log('extractedFieldsXML', extractedFieldsXML)
					if(this.requestedLanguages.length > 0)
					this.requestedLanguages.forEach(async (requestedLanguage) => {
						const response = await deepLTranslate(
											extractedFieldsXML,
											requestedLanguage.split("-")[0].trim(),
											// this.currentLanguage.split("-")[0].toUpperCase(),
											sourceLanguage,
											this.apiKey,
										);
						if (response) {
							// this.successMessage();
							xml2js.parseString(
								response.translations[0].text,
								(err, result) => {
									if (err) throw err;
									json = JSON.parse(JSON.stringify(result, null, 4));
								}
							);
	
							storyObject = await updateStory( this.$route.query.space_id, this.story.id, 
																  JSON.parse(this.updatingStoryContents( storyJson, storyObject,
																										 requestedLanguage, json )));
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