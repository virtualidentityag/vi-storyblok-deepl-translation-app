import Storyblok from "./Storyblok-config";

export const fetchDataSources = async (spaceId) => {
    let datasource = await Storyblok.get(`spaces/${spaceId}/datasources`, {"slug": "deepl-api-key"})
							.then(response => {
								return response;
							}).catch(error => { 
								console.log(error)
							})
    return datasource
}

export const fetchDataSourceEntries = async (spaceId) => {
    let apiKey = ""
    let invalidKey = true
    let entry = await Storyblok.get(`spaces/${spaceId}/datasource_entries`, {
                        "datasource_slug": "deepl-api-key"
                })
                .then(response => {
                    return response;
                }).catch(error => { 
                    console.log(error)
                })
                
    if(!entry){
        let dataSource = await createDataSource(spaceId);
        
        if(dataSource){
            let newEntry = await createDataSourceEntry(spaceId,dataSource.data.datasource.id)
            
            if(newEntry)
                apiKey = newEntry.data.datasource_entry
            else
                return false;
        }
    }
    else{
        let key = entry.data.datasource_entries.find(element => element.name === "Deepl-Api-key")

        if(key){
            if(key.value.trim() !== "Enter-Api-Key-Here"){
                apiKey = key.value;
                invalidKey = false;
            }
            else
                invalidKey = true;
        }
        else{
            let datasource = await fetchDataSources(spaceId)

            if(datasource){
                let dataSourceId = datasource.data.datasources.find(element => element.slug === "deepl-api-key").id
                let newEntry = await createDataSourceEntry(spaceId,dataSourceId)
                
                if(newEntry)
                    apiKey = newEntry.data.datasource_entry
                else
                    return false;
            }
            
            invalidKey = true;

        }
    }

    return {apiKey, invalidKey}
}

export const createDataSource = async (spaceId) => {
    let newDataSource = await Storyblok.post(`spaces/${spaceId}/datasources`,{
                            "datasource": {
                                "name": "Api key for DeepL",
                                "slug": "deepl-api-key",
                            }
                        }).then(response => {
                            console.log(response)
                            return response
                        }).catch(error => { 
                            console.log(error)
                        })
    
    return newDataSource
}

export const createDataSourceEntry = async (spaceId, dataSourceId) => {
    let newDataSource = await Storyblok.post(`spaces/${spaceId}/datasource_entries`,{
                            "datasource_entry": {
                                "name": "Deepl-Api-key",
                                "value": "Enter-Api-Key-Here",
                                "datasource_id": dataSourceId
                            }
                        }).then(response => {
                            console.log(response)
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
            console.log("response of fetched stor", response);
            return response.data;
        })
        .catch((error) => {
            console.log(error);
        });
    
    const storyJSONWithLang = await Storyblok.get(
        `spaces/${spaceId}/stories/${storyId}/export.json`,
        // {}
          {lang_code: language}
        )
        .then((response) => {
            console.log("response of fetched stor", response);
            return response.data;
        })
        .catch((error) => {
            console.log(error);
        });

    return { storyObj, storyJSON, storyJSONWithLang };
}

// export const  updateStory = async (spaceId, storyId, story) => {
//     const response = await Storyblok.put(
//         `spaces/${spaceId}/stories/${storyId}`,{
//             story: { ...story },
//         }
//     )
//         .then((response) => {
//             return response.data.story;
//         })
//         .catch((error) => {
//             console.log(error);
//         });
//     console.log("updated response", response);
//     return response;
// }

export const  updateStory = async (spaceId, storyId, story, languageCode) => {
    const response = await Storyblok.put(
        `spaces/${spaceId}/stories/${storyId}/import.json`,{
            "data": story,
            "lang_code": languageCode
        }
    )
        .then((response) => {
            return response.data.story;
        })
        .catch((error) => {
            console.log(error);
        });
    console.log("updated response", response);
    return response;
}