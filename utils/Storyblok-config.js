import StoryblokClient from "storyblok-js-client";

// 2. Initialize the client with the preview token
// from your space dashboard at https://app.storyblok.com
let Storyblok = new StoryblokClient({
	// accessToken: "dcQTazjLaLG9moded4LVLAtt", //demo Space
	// accessToken: "Zwnh134MzUHMlWfBS85bzAtt", //Sample Space
	accessToken: process.env.ACCESS_TOKEN, //Sample Space
	oauthToken: "oEUkARZp6T0hsoGu5MzQoAtt-93801-ThmkXinfFu3HiGeYzNku",
});

export default Storyblok;
