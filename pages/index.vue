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
			// to get the current story once app is loaded
			processMessage(event) {
				// console.log('event outside', event)
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

					// console.log("event.data.story.localized_paths", event.data.story.localized_paths);
					// console.log("story", event.data.story);
					// console.log(".data", event.data.language);
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
					// console.log('key', key, entry);

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
							// console.log('DataSource', datasource)

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
				// console.log('splitteedString', splittedString, languageString)
				return splittedString.reduce((previousValue, currentValue) => previousValue.trim() + '_' + currentValue.trim())
			},

			generateXML(arr){
				let str = ''
				for(let i = 0; i < arr.length; i++){
					console.log(arr[i])
					for(let key in arr[i]){
						str+= `${'<'+[key]+'>'+[arr[i][key]]+'</'+[key]+'>'}`
					}
				}

				return str;
			},
			convertXMLToJSON(xml,extractedFields){
				let arr = []

				for(let i = 0; i < extractedFields.length; i++){
					let key = xml.substring(xml.indexOf('<')+1, xml.indexOf('>'))
					let value = xml.substring(xml.indexOf('>')+1, xml.indexOf('</'))

					xml = xml.substring(xml.indexOf('><')+1, xml.length)

					arr.push({[key]: value})
				}
				return arr;
			},

			// extracts the fields from story object with the help of story json returned by export.json api
			extractingFields(storyJson,storyObject) {
				let splitArray = [];

				for (let keys in storyJson) {
					let extracted = keys.split(":"); // splitting e.g {4e272c60-a59e-4c1d-b7bc-115b920588e6:button:text: "Call to action"} in 3 parts
					let splitStr = "";
					// console.log('keys uid', keys)
					// console.log('extracted0', extracted[0])
					// console.log('length = ', extracted.length, extracted)
					// if (extracted.length > 1 && extracted.length < 4) {
					if (extracted.length > 1 ) {

						splitStr = JSON.stringify(storyObject).slice(JSON.stringify(storyObject).indexOf(extracted[0])); //splitting the object from _uid and further
 
					
						if (splitStr.indexOf(extracted[1]) < splitStr.indexOf(extracted[2])) { //making sure to further extract on correct positions
							splitStr = splitStr.slice(splitStr.indexOf(`"${extracted[1]}"`));
							splitStr = splitStr.slice(splitStr.indexOf(`"${extracted[2]}"`));
						} 
						else
							splitStr = splitStr.slice(splitStr.indexOf(`"${extracted[2]}":${storyJson[keys]}`));

						splitStr = splitStr.match(/[^\[](.*)[^\]]/g); // cleaning the string

						if (splitStr) {
							// console.log('splitStr!!!!!!!', splitStr);
							splitStr 	 = splitStr.toString().split(`,"`);
							let strKey 	 = splitStr[0].substring(0, splitStr[0].indexOf(":"));
							let strValue = splitStr[0].substring( splitStr[0].indexOf(":") + 1);
							// console.log('strKey', strKey,' |||| ', strValue);
							// console.log('strValue', strValue);
							splitArray.push({ [`${JSON.parse(strKey)}`]: JSON.parse(strValue) }); // creating an array of translatable fields
							// console.log('splitArray', splitArray)
						}
					}
				}

				return splitArray
			},

			//updating the story with translated content using the same process used in extraction 
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
					
						// checking if the field name already exist with i81n code, so it can be replaced and a new one can be added for updated content
						if (JSON.stringify(secondHalfStr).includes(`${extracted[2]}__i18n__${this.transformLanguageString(requestedLanguage)}`)) {
							secondHalfStr = secondHalfStr.replace(`"${extracted[2]}__i18n__${this.transformLanguageString(requestedLanguage)}"`,
																`"${extracted[2]}__i18n__XXXX${this.transformLanguageString(requestedLanguage)}"`)
						}

							for (let _keys in translatedJson[0]) {

								// making sure string is being concatinated on the correct position
								if (_keys.localeCompare(extracted[2]) === Number(0)) {
									
									let value =  translatedJson[0][_keys];
									let newObj = `"${_keys}__i18n__${this.transformLanguageString(requestedLanguage)}":${JSON.stringify(value)}`;

									if(value.startsWith('"') && value.endsWith('"'))
										newObj = `"${_keys}__i18n__${this.transformLanguageString(requestedLanguage)}":"\\${value}`; 
									
									fullStr = splitingResponse[0].concat(`"${extracted[0]}"`);
								
									if(!fullStr.endsWith(',')){ // trying to make the correct format of the json
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

									// removing the key which has just been concatinated
									if (translatedJson[0][_keys].length > 1) translatedJson.splice(0,1);

									translatedStoryObj = fullStr;
									break;
								}
						}
					}
				}	

				return translatedStoryObj;
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
					let json = "";
					let updatedStory = await fetchStory(this.$route.query.space_id,this.story.id, this.availableLanguages[0].lang);
					let storyObject = updatedStory.storyObj
					let storyJson = this.removeUnwanted(updatedStory.storyJSON,  updatedStory.storyJSONWithLang)
					
					let extractedFields = [];
					let sourceLanguage = this.currentLanguage !== "Default Language" ? this.currentLanguage.split("-")[0].toUpperCase() : ""
	
					// console.log('storyJSON', storyJson);
					extractedFields = Array.from(this.extractingFields(storyJson, storyObject))
					console.log('extractedFields', extractedFields);

					// converting json to xml
					let extractedFieldsXML = this.generateXML(extractedFields)

					// let builder = new xml2js.Builder();
					// // let extractedFieldsXML = builder.buildObject(extractedFields);
					// let extractedFieldsXML = builder.buildObject(JSON.parse(JSON.stringify(extractedFields)));
					
					
					this.requestedLanguages.forEach(async (requestedLanguage) => {
						const response = await deepLTranslate(
											extractedFieldsXML,
											requestedLanguage.split("-")[0].trim(),
											sourceLanguage,
											this.apiKey,
										);
						if (response) {

							// converting xml to json
							let convertedXml = this.convertXMLToJSON(response.translations[0].text,extractedFields)

							// xml2js.parseString(
							// 	response.translations[0].text,
							// 	(err, result) => {
							// 		if (err) throw err;
							// 		json = JSON.parse(JSON.stringify(result, null, 4));
							// 	}
							// );
							// console.log('convertedXml', convertedXml)
	
							storyObject = await updateStory( this.$route.query.space_id, this.story.id, 
																  JSON.parse(this.updatingStoryContents( storyJson, storyObject,
																										 requestedLanguage, convertedXml )));
						
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