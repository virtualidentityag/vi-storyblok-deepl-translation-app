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
        `spaces/${spaceId}/stories/${storyId}/export.xml`,
        // {}
        //   language !== "" && language !== "Default Language" ? {lang_code: language} : {}
        )
        .then((response) => {
            console.log("response of fetched stor", response);
            return response.data;
        })
        .catch((error) => {
            console.log(error);
        });

    return { storyObj, storyJSON };
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
export const  updateStory = async (spaceId, storyId, story) => {
    const response = await Storyblok.put(
        `spaces/${spaceId}/stories/${storyId}/import.xml`,{
            story: { ...story },
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