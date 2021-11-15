import axios from 'axios';
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
    // let getStoryObj =  await axios.get(`spaces/${spaceId}/stories/${storyId}`,{})

    // let getStoryJSON = await axios.get(`spaces/${spaceId}/stories/${storyId}/export.json`,{})
    //       //   language !== "" && language !== "Default Language" ? {lang_code: language} : {}
    
    // let getStoryJSONWithLang = await axios.get(`spaces/${spaceId}/stories/${storyId}/export.json`, {lang_code: language})

    // let responses = await axios
    //                     .all([getStoryObj, getStoryJSON, getStoryJSONWithLang])
    //                     .then(
    //                         axios.spread((...responses) => {
    //                         getStoryObj = responses[0].data.story;
    //                         getStoryJSON = responses[1];
    //                         getStoryJSONWithLang = responses[2];
    //                         // const responseOne = responses[0];
    //                         // const responseTwo = responses[1];
    //                         // const responesThree = responses[2];
                        
    //                         // use/access the results
    //                         // console.log('responseOne',responseOne);
    //                         // console.log('responseTwo',responseTwo);
    //                         // console.log('responesThree',responesThree);
    //                         })
    //                     )
    //                     .catch(errors => {
    //                         // react on errors.
    //                         console.error(errors);
    //                     });

    // console.log('responseOne', responses.getStoryObj);
    // console.log('responseTwo', responses.getStoryJSON);
    // console.log('responesThree', responses.getStoryJSONWithLang);

    const storyObj = await Storyblok.get(
        `spaces/${spaceId}/stories/${storyId}`,{})
        .then((response) => {
            return response.data.story;
        })
        .catch((error) => {
            console.log(error);
        });

    const storyJSON = await Storyblok.get(
        `spaces/${spaceId}/stories/${storyId}/export.json`,
        {}
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

export const  updateStory = async (spaceId, storyId, story) => {
    const response = await Storyblok.put(
        `spaces/${spaceId}/stories/${storyId}`,{
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
// export const  updateStory = async (spaceId, storyId, story) => {
//     const response = await Storyblok.put(
//         `spaces/${spaceId}/stories/${storyId}/import.json`,{
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