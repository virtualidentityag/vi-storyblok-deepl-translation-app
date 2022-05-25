import Storyblok from "./Storyblok-config";

export const fetchDataSources = async (spaceId, datasourceSlug) => {
    let datasource = await Storyblok.get(`spaces/${spaceId}/datasources`, {"slug": datasourceSlug})
							.then(response => {
								return response;
							}).catch(error => { 
								console.log(error)
							})
    return datasource
}

export const fetchDataSourceEntries = async (spaceId) => {
    let apiKey = ""
    let modeOfTranslation = ""
    let invalidMode = true
    let invalidKey = true
    let deeplEntryExistResult = undefined;
    let modeOfTranslationEntryExistResult = undefined;

    let deeplKey = await Storyblok.get(`spaces/${spaceId}/datasource_entries`, {
                        "datasource_slug": "deepl-api-key"
                })
                .then(response => {
                    return response;
                }).catch(error => { 
                    console.log(error)
                })
    
    let translationMode = await Storyblok.get(`spaces/${spaceId}/datasource_entries`, {
                        "datasource_slug": "mode-of-translation"
                })
                .then(response => {
                    return response;
                }).catch(error => { 
                    console.log(error)
                })
                
    deeplEntryExistResult = await dataSourceAlreadyExists(deeplKey, "Api key for DeepL", "Deepl-Api-key", "deepl-api-key", "Enter-Api-Key-Here", false, spaceId)
    modeOfTranslationEntryExistResult = await dataSourceAlreadyExists(translationMode,"Mode Of Translation", "Mode-Of-Translation", "mode-of-translation", "FOLDER_LEVEL-OR-FIELD_LEVEL", true, spaceId)

    if(deeplEntryExistResult){
        apiKey = deeplEntryExistResult.entryData;
        invalidKey = deeplEntryExistResult.entryDoesNotExist
    }

    if(modeOfTranslationEntryExistResult){
        modeOfTranslation = modeOfTranslationEntryExistResult.entryData;
        invalidMode = modeOfTranslationEntryExistResult.entryDoesNotExist
    }

    return {apiKey, invalidKey, modeOfTranslation, invalidMode}
}

const dataSourceAlreadyExists = async (entryKey, datasourceName, elementName, datasourceSlug, datasourceInitialValue, hasFixedValue, spaceId) => {

    let entryData = '';
    let entryDoesNotExist = true;

     if(!entryKey){
        let dataSource = await createDataSource(spaceId, datasourceName, datasourceSlug);
        
        if(dataSource){
            let newEntry = await createDataSourceEntry(spaceId, elementName, datasourceInitialValue, dataSource.data.datasource.id);
            
            if(newEntry)
                entryData = newEntry.data.datasource_entry;
            else
                return false;
        }
    }
    else{
        let key = entryKey.data.datasource_entries.find(element => element.name === elementName)

        if(key){
            if(hasFixedValue){
                if(key.value.trim() === datasourceInitialValue.split('-OR-')[0] || key.value.trim() === datasourceInitialValue.split('-OR-')[1]){
                    entryData = key.value;
                    entryDoesNotExist = false;
                }
                else
                    entryDoesNotExist = true;
            }
            else{
                if(key.value.trim() !== datasourceInitialValue){
                    entryData = key.value;
                    entryDoesNotExist = false;
                }
                else
                    entryDoesNotExist = true;
            }
        }
        else{
            let datasource = await fetchDataSources(spaceId, datasourceSlug)

            if(datasource){
                let dataSourceId = datasource.data.datasources.find(element => element.slug === datasourceSlug).id
                let newEntry = await createDataSourceEntry(spaceId, elementName, datasourceInitialValue, dataSourceId)
                
                if(newEntry)
                    entryData = newEntry.data.datasource_entry
                else
                    return false;
            }
            
            entryDoesNotExist = true;

        }
    }

    return {entryData, entryDoesNotExist}
}

export const createDataSource = async (spaceId, name, slug) => {
    let newDataSource = await Storyblok.post(`spaces/${spaceId}/datasources`,{
                            "datasource": {
                                "name": name,
                                "slug": slug,
                            }
                        }).then(response => {
                            // console.log.response)
                            return response
                        }).catch(error => { 
                            console.log(error)
                        })
    
    return newDataSource
}

export const createDataSourceEntry = async (spaceId, name, value, dataSourceId) => {
    let newDataSource = await Storyblok.post(`spaces/${spaceId}/datasource_entries`,{
                            "datasource_entry": {
                                "name": name,
                                "value": value,
                                "datasource_id": dataSourceId
                            }
                        }).then(response => {
                            // console.log.response)
                            return response
                        }).catch(error => { 
                            console.log(error)
                        })
    return newDataSource;
}


export const fetchStory = async (spaceId, storyId, language) => {
    const storyObj = await Storyblok.get(
        `spaces/${spaceId}/stories/${storyId}`,{})
        .then((response) => {
            return response.data.story;
        })
        .catch((error) => {
            console.log(error);
        });

    const storyJSON = await Storyblok.get(
        `spaces/${spaceId}/stories/${storyId}/export.json`, {}
        //   language !== "" && language !== "Default Language" ? {lang_code: language} : {}
        )
        .then((response) => {
            // console.log."response of fetched stor", response);
            return response.data;
        })
        .catch((error) => {
            console.log(error);
        });
    
    const storyJSONWithLang = await Storyblok.get(
        `spaces/${spaceId}/stories/${storyId}/export.json`,
          {lang_code: language}
        )
        .then((response) => {
            // console.log."response of fetched stor", response);
            return response.data;
        })
        .catch((error) => {
            console.log(error);
        });

    return { storyObj, storyJSON, storyJSONWithLang };
}


export const  updateStory = async (spaceId, storyId, story, languageCode) => {
    const response = await Storyblok.put(
        `spaces/${spaceId}/stories/${storyId}/import.json`,{
            "data": story,
            "lang_code": languageCode ? languageCode : ""
        }
    )
        .then((response) => {
            return response.data.story;
        })
        .catch((error) => {
            console.log(error);
        });
    // console.log."updated response", response);
    return response;
}