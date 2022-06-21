<template >
  <div>
    <div v-if="showConfigurationScreen">
      <ConfigurationScreen
        @close="switchTabs"
        @updateApiKey="updateApiKey"
        @updateMode="updateMode"
        :deeplKey="apiKey"
        :mode="modeOfTranslation"
        :deeplKeyObj="apiKeyObj"
        :modeObj="modeOfTranslationObj"
      />
    </div>
    <div v-if="!showConfigurationScreen">
      <div class="bodyFontStyle" v-if="!loadingContext">
        <el-row v-if="!languagesAvailable">
          <el-alert
            title="No languages found"
            type="error"
            description="Please setup field level translation and add languages to use the application. 
				For more info visit: https://www.storyblok.com/docs/guide/in-depth/internationalization"
            show-icon
            :closable="false"
          >
          </el-alert>
        </el-row>

        <el-row v-else>
          <el-row>
            <el-col :span="6" :offset="14">
              <el-button
                icon="el-icon-setting"
                type="primary"
                size="mini"
                v-on:click="switchTabs"
                >Edit Settings</el-button
              >
            </el-col>
          </el-row>
          <p>
            Content will be translated from: {{ getlangName(currentLanguage) }}
          </p>
          <p v-if="getTranslationModeName(modeOfTranslation)">
            Translation Mode is set to:
            <strong>{{ getTranslationModeName(modeOfTranslation) }}</strong>
          </p>
          <p class="error-text" v-else>
            Please set the translation mode in the Datasource ->
            Mode-Of-Translation
          </p>

          <el-row v-if="modeOfTranslation === 'FIELD_LEVEL'">
            <p>Translate Into: (required)</p>

            <el-checkbox-group
              v-for="locale in availableLanguages"
              :disabled="invalidKey || invalidMode"
              :key="locale.lang"
              v-model="requestedLanguagesForFieldLevel"
            >
              <el-checkbox :label="locale.lang">
                {{ getAvailableLanguagesName(locale.lang) }}
              </el-checkbox>
            </el-checkbox-group>
          </el-row>

          <el-row v-else>
            <p>Translate Into: (required)</p>

            <el-radio-group
              v-for="locale in availableLanguages"
              :disabled="invalidKey || invalidMode"
              :key="locale.lang"
              v-model="requestedLanguagesForFolderLevel"
            >
              <el-radio :label="locale.lang">
                {{ getAvailableLanguagesName(locale.lang) }}
              </el-radio>
            </el-radio-group>
          </el-row>

          <el-row>
            <el-button
              v-on:click="sendTranslationRequest"
              :disabled="invalidKey || invalidMode"
              type="primary"
              size="mini"
            >
              Translate Content
            </el-button>
          </el-row>
        </el-row>

        <el-row v-show="invalidKey">
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
            :closable="false"
          >
          </el-alert>
        </el-row>
        <el-row v-show="invalidMode">
          <el-alert
            title="Invalid Translation Mode."
            type="error"
            description="Please enter a valid translation mode:
				> For folder level translations enter -> FOLDER_LEVEL
				
				> For Field level translations enter -> FIELD_LEVEL"
            show-icon
            :closable="false"
          >
          </el-alert>
        </el-row>
      </div>
      <div v-else></div>
    </div>
  </div>
</template>

<script>
import { Notification } from "element-ui";
import { deepLTranslate } from "./../utils/deepl-services";
import {
  fetchStory,
  updateStory,
  fetchDataSourceEntries,
} from "../utils/services";
import { languageCodes } from "./../utils/language-codes";

import ConfigurationScreen from "./../components/ConfigurationScreen.vue";
import { API_KEY_INITIAL_VALUE } from "../utils/constants";

export default {
  name: "index",
  components: {
    ConfigurationScreen,
  },
  data() {
    return {
      showConfigurationScreen: false,
      story: undefined,
      apiKeyObj: undefined,
      modeOfTranslationObj: undefined,
      loadingContext: true,
      invalidKey: true,
      invalidMode: true,
      languagesAvailable: false,
      currentLanguage: "",
      apiKey: "",
      modeOfTranslation: "",
      availableLanguages: [],
      requestedLanguagesForFieldLevel: [],
      requestedLanguagesForFolderLevel: "",
      translationMode: "",
      spaceId: this.$route.query.space_id,
      // spaceId: '157196',
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
        // tool: "virtual-identity-ag@auto-translations-app",
        tool: "virtual-identity-ag@translations-backup-app",
        event: "getContext",
      },
      "https://app.storyblok.com"
    );

    // Use heightChange to change the height of the tool
    window.parent.postMessage(
      {
        action: "tool-changed",
        // tool: "virtual-identity-ag@auto-translations-app",
        tool: "virtual-identity-ag@translations-backup-app",
        event: "heightChange",
        height: 500,
      },
      "https://app.storyblok.com"
    );

    this.initDataSources();
  },

  methods: {
    // to get the current story once app is loaded
    processMessage(event) {
      // console.log('event outside', event)
      if (event.data && event.data.action == "get-context") {
        // console.log('event', event)
        this.loadingContext = false;
        this.story = event.data.story;
        this.currentLanguage =
          event.data.language !== "" ? event.data.language : "Default Language";

        if (event.data.story.localized_paths.length > 0) {
          this.languagesAvailable = true;
          this.availableLanguages = Array.from(
            event.data.story.localized_paths
          );
        }
      }
    },

    switchTabs() {
      this.showConfigurationScreen = !this.showConfigurationScreen;
    },

    updateApiKey(apiValues) {
      if (apiValues.key !== API_KEY_INITIAL_VALUE) {
        this.invalidKey = false;
      } else {
        this.invalidKey = true;
      }
      this.apiKey = apiValues.key;
      this.apiKeyObj = { ...apiValues.obj };
    },
    updateMode(translationModeObj) {
      // this.invalidMode = true;if(key.value.trim() === datasourceInitialValue.split('-OR-')[0] || key.value.trim() === datasourceInitialValue.split('-OR-')[1]){
      if (
        translationModeObj.mode.trim() !== "FOLDER_LEVEL" &&
        translationModeObj.mode.trim() !== "FIELD_LEVEL"
      ) {
        this.invalidMode = true;
      } else {
        this.invalidMode = false;
      }

      this.modeOfTranslation = translationModeObj.mode;
      this.modeOfTranslationObj = { ...translationModeObj.obj };
    },

    // return language name for the given code
    getlangName(langCode) {
      if (langCode !== "Default Language")
        return languageCodes.find((lang) => lang.code === langCode).name;
      else return langCode;
    },

    getTranslationModeName(mode) {
      if (mode === "FOLDER_LEVEL") return "Folder Level";
      else if (mode === "FIELD_LEVEL") return "Field Level";
      else return false;
    },

    getAvailableLanguagesName(code) {
      return code + " - " + this.getlangName(code);
    },

    async initDataSources() {
      let dataSourceObj = await fetchDataSourceEntries(this.spaceId);

      if (dataSourceObj) {
        this.apiKey = dataSourceObj.apiKey.value;
        this.apiKeyObj = dataSourceObj.apiKey;
        this.invalidKey = dataSourceObj.invalidKey;
        this.modeOfTranslation = dataSourceObj.modeOfTranslation.value;
        this.modeOfTranslationObj = dataSourceObj.modeOfTranslation;
        this.invalidMode = dataSourceObj.invalidMode;
      }
    },

    transformLanguageString(languageString) {
      const splittedString = languageString.split("-");
      return splittedString.reduce(
        (previousValue, currentValue) =>
          previousValue.trim() + "_" + currentValue.trim()
      );
    },

    generateXML(obj) {
      let str = "";

      for (let key in obj) {
        str += `${"<" + [key] + ">" + [obj[key]] + "</" + [key] + ">"}`;
      }

      return str;
    },
    convertXMLToJSON(xml, extractedFields) {
      let obj = {};

      for (let key in extractedFields) {
        let _key = xml.substring(xml.indexOf("<") + 1, xml.indexOf(">"));
        let _value = xml.substring(xml.indexOf(">") + 1, xml.indexOf("</"));

        xml = xml.substring(xml.indexOf("><") + 1, xml.length);

        let removed = JSON.stringify(_value).replace(`"\"`, `"`);
        removed = removed.replace(`\""`, `"`);

        Object.assign(obj, { [_key]: _value });
      }

      return obj;
    },

    // extracts the fields from story object with the help of story json returned by export.json api
    extractingFields(storyJson, storyObject) {
      let translatableContents = {};
      let languageStr =
        this.currentLanguage === "Default Language"
          ? ""
          : `__i18n__${this.transformLanguageString(this.currentLanguage)}`;

      for (let keys in storyJson) {
        let extracted = keys.split(":"); // splitting e.g {4e272c60-a59e-4c1d-b7bc-115b920588e6:button:text: "Call to action"} in 3 parts
        let extractedContent = [];
        let keyBackUp = "";
        let checkFurther = true;

        if (extracted.length > 1) {
          for (let _keys in storyObject.content) {
            if (storyObject.content._uid === extracted[0]) {
              // if the field is directly inside content object
              if (
                storyObject.content.component === extracted[1] &&
                storyObject.content[extracted[2]]
              ) {
                // just checking the component and field name for it
                Object.assign(translatableContents, {
                  [`${keys}`]:
                    storyObject.content[`${extracted[2]}${languageStr}`],
                });
                checkFurther = false;
              }
            } else if (
              JSON.stringify(storyObject.content[_keys]).includes(extracted[0])
            ) {
              extractedContent = Array.from(storyObject.content[_keys]);
            }
          }

          if (checkFurther) {
            do {
              let existsInKeyName = "";

              if (keyBackUp !== "")
                extractedContent = extractedContent[keyBackUp];

              extractedContent = extractedContent.reduce(
                (previousValue, currentValue) => {
                  if (JSON.stringify(previousValue).includes(extracted[0]))
                    return previousValue;
                  //determining in which obj the _uid is present
                  else return currentValue;
                }
              );

              if (extractedContent.component !== extracted[1]) {
                //checking if we are in the correct obj, extracted¢[1] includes the name of the component
                for (let _keys in extractedContent) {
                  if (
                    JSON.stringify(extractedContent[_keys]).includes(
                      extracted[1]
                    )
                  ) {
                    //determining if the object is further nested where out content is present
                    existsInKeyName = _keys; //and the name of the key in which it is present
                    break;
                  }
                }
              }

              if (
                !Array.isArray(extractedContent[existsInKeyName]) &&
                typeof extractedContent[existsInKeyName] === "object"
              )
                if (
                  extractedContent._uid == extracted[0] &&
                  extractedContent.component == extracted[1]
                )
                  //if the key is the type of object {}
                  break;

              if (extractedContent._uid == extracted[0])
                //if _uid has been matched, copy the value of 2nd index to 1st since extracted[0] is being used above
                extracted[0] = extracted[1];

              keyBackUp = existsInKeyName; //creating a backup of existsInKeyName
            } while (extractedContent.component !== extracted[1]); //loop until component name is not matched

            if (extractedContent) {
              Object.assign(translatableContents, {
                [`${keys}`]: extractedContent[`${extracted[2]}${languageStr}`],
              }); // creating an object of translatable fields
            }
          }
        }
      }

      return translatableContents;
    },

    // storyJsonWithLang only contains the translatable fields
    // both objects are being compared and those keys which are not present in storyJsonWithLang are being removed from storyJson
    removeUnwanted(storyJson, storyJsonWithLang) {
      let newStoryJson = {};

      for (let keyOfStoryJson in storyJson) {
        if (storyJsonWithLang.hasOwnProperty(keyOfStoryJson)) {
          Object.assign(newStoryJson, {
            [keyOfStoryJson]: JSON.stringify(storyJson[keyOfStoryJson]),
          });
        }
      }

      return newStoryJson;
    },

    // updateLocalStorage(){ // to update the current selected language to the trnaslated language

    // 	const privateSettings = {"lang":{"160901":"de-de"},"assetFolderStates":{},"editorMinimized":false,"expires":1654951288800}

    // 	localStorage.setItem("privateSettings", JSON.stringify(privateSettings));

    // 	// setTimeout(() => {
    // 	// 	const page = window.open(`${document.referrer}#!/me/spaces/${this.spaceId}/stories/0/0/${this.story.id}?update=true`);
    // 	// 	page.localStorage.setItem("privateSettings",JSON.stringify(privateSettings));
    // 	// }, 1000)

    // 	console.log('page opened', Storyblok)
    // },

    closePage() {
      setTimeout(() => {
        window.top.close(
          `${document.referrer}#!/me/spaces/${this.spaceId}/stories/0/0/${this.story.id}`
        );
      }, 1000);
    },

    async folderLevelTranslationRequest(
      storyObject,
      storyJson,
      extractedFields,
      extractedFieldsXML,
      sourceLanguage
    ) {
      const response = await deepLTranslate(
        extractedFieldsXML,
        this.requestedLanguagesForFolderLevel.split("-")[0].trim(),
        sourceLanguage,
        this.apiKey
      );

      if (response) {
        let convertedXml = {
          ...this.convertXMLToJSON(
            response.translations[0].text,
            extractedFields
          ),
          language: this.requestedLanguagesForFolderLevel,
          page: this.story.id + "",
          text_nodes: JSON.parse(storyJson.text_nodes),
          url: JSON.parse(storyJson.url),
        };

        storyObject = await updateStory(
          this.spaceId,
          this.story.id,
          JSON.stringify(convertedXml)
        ); // folder level

        if (storyObject) {
          this.successMessage();

          window.open(
            `${document.referrer}#!/me/spaces/${this.spaceId}/stories/0/0/${this.story.id}?update=true`
          );
          this.closePage();
        } else {
          this.languageErrorMessage(this.requestedLanguagesForFolderLevel);
        }
      }
    },

    async fieldLevelTranslationRequest(
      storyObject,
      storyJson,
      extractedFields,
      extractedFieldsXML,
      sourceLanguage
    ) {
      this.requestedLanguagesForFieldLevel.forEach(
        async (requestedLanguage) => {
          const response = await deepLTranslate(
            extractedFieldsXML,
            requestedLanguage.split("-")[0].trim(),
            sourceLanguage,
            this.apiKey
          );

          if (response) {
            let convertedXml = {
              ...this.convertXMLToJSON(
                response.translations[0].text,
                extractedFields
              ),
              language: requestedLanguage,
              page: this.story.id + "",
              text_nodes: JSON.parse(storyJson.text_nodes),
              url: JSON.parse(storyJson.url),
            };

            storyObject = await updateStory(
              this.spaceId,
              this.story.id,
              JSON.stringify(convertedXml),
              requestedLanguage
            );

            if (storyObject) {
              this.successMessage();

              window.open(
                `${document.referrer}#!/me/spaces/${this.spaceId}/stories/0/0/${this.story.id}?update=true`
              );
              this.closePage();
            } else {
              this.languageErrorMessage(requestedLanguage);
            }
          }
        }
      );
    },

    async sendTranslationRequest() {
      if (
        this.requestedLanguagesForFieldLevel.length > 0 ||
        this.requestedLanguagesForFolderLevel !== ""
      ) {
        if (
          !this.requestedLanguagesForFieldLevel.includes(this.currentLanguage)
        ) {
          let updatedStory = await fetchStory(
            this.spaceId,
            this.story.id,
            this.availableLanguages[0].lang
          );
          let storyObject = updatedStory.storyObj;
          let storyJson = this.removeUnwanted(
            updatedStory.storyJSON,
            updatedStory.storyJSONWithLang
          );
          let extractedFields = {
            ...this.extractingFields(storyJson, storyObject),
          };
          let sourceLanguage =
            this.currentLanguage !== "Default Language"
              ? this.currentLanguage.split("-")[0].toUpperCase()
              : "";
          let extractedFieldsXML = this.generateXML(extractedFields); // converting json to xml

          if (this.modeOfTranslation === "FOLDER_LEVEL")
            this.folderLevelTranslationRequest(
              storyObject,
              storyJson,
              extractedFields,
              extractedFieldsXML,
              sourceLanguage
            );
          else
            this.fieldLevelTranslationRequest(
              storyObject,
              storyJson,
              extractedFields,
              extractedFieldsXML,
              sourceLanguage
            );

          // this.requestedLanguagesForFieldLevel.forEach(async (requestedLanguage) => {
          // 	const response = await deepLTranslate(
          // 						extractedFieldsXML, requestedLanguage.split("-")[0].trim(),
          // 						sourceLanguage, this.apiKey,
          // 					);

          // 	if (response) {

          // 		let convertedXml = {
          // 			...this.convertXMLToJSON(response.translations[0].text, extractedFields),
          // 			language: requestedLanguage,
          // 			page: this.story.id+"",
          // 			text_nodes: JSON.parse(storyJson.text_nodes),
          // 			url: JSON.parse(storyJson.url)
          // 		}

          // if(this.modeOfTranslation === 'FOLDER_LEVEL')
          // 	storyObject = await updateStory( this.spaceId, this.story.id, JSON.stringify(convertedXml)); // folder level
          // else
          // 	storyObject = await updateStory( this.spaceId, this.story.id, JSON.stringify(convertedXml),requestedLanguage);

          // 		if(storyObject) {
          // 			this.successMessage();

          // 			// this.updateLocalStorage();
          // 			window.open(`${document.referrer}#!/me/spaces/${this.spaceId}/stories/0/0/${this.story.id}?update=true`);
          // 			this.closePage();
          // 		}
          // 		else {
          // 			this.languageErrorMessage(requestedLanguage)
          // 		}
          // 	}
          // });
        } else
          this.customErrorMessage(
            "Requested languages should not include source language"
          );
      } else
        this.customErrorMessage("Please select atleast one target language");
    },
    successMessage() {
      Notification({
        title: "Success",
        message: "Translation Successful!",
        type: "success",
      });
    },
    customErrorMessage(_message) {
      Notification({
        title: "Error",
        message: _message,
        type: "error",
      });
    },
    languageErrorMessage(lang) {
      Notification({
        title: "Error",
        message: `Error occurred for language ${this.getlangName(
          lang
        )}. Please try again later.`,
        type: "error",
        duration: 20000,
      });
    },
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
.bodyFontStyle {
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
  border: 1px solid #ebeef5;
  position: fixed;
  background-color: #fff;
  box-shadow: 0 2px 12px 0 rgb(0 0 0 / 10%);
  transition: opacity 0.3s, transform 0.3s, left 0.3s, right 0.3s, top 0.4s,
    bottom 0.3s;
  overflow: hidden;
}
.el-radio-button__inner,
.el-radio-group {
  display: block;
  margin-bottom: 2px;
}
p {
  font-size: smaller;
}
.error-text {
  color: #f56c6c;
  font-weight: bold;
}
</style>
