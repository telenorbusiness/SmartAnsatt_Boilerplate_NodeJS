# Smart Ansatt boilerplate for NodeJS

A boilerplate for a simple Tile with a simple Micro App.

The server has to be hosted with a public domain if you want to test it in Smart Ansatt. However, you have to include the following variables in the process.env:

* CLIENT_ID
* CLIENT_SECRET
* JSON_KEYSTORE
* BASE_URL

### Service config

Before you can access CLIENT_ID, CLIENT_SECRET and JSON_KEYSTORE, you need to create a service in our development portal at https://developer.smartansatt.telenor.no. During the creation you should clearly see CLIENT_ID and CLIENT_SECRET under the service -> details page. 

To create your JSON_KEYSTORE, you will need to configure the **Encrypted Response Algorithm**, **Encrypted Response Encoding** and **Signed Response Algorithm** as defined in the code ("RSA1_5", "A128CBC-HS256" and "HS256" respectively). 

Afterwards click copy and stringify the JSON-object before adding it to process.env as JSON_KEYSTORE.

### Your API URL

The BASE_URL is the URL to where you're hosting the server. This done so the Tile can link to the Micro App in the code.

### Configure APIs in Smart Ansatt

When you have spun up the server, you can add the API URL to the Tile (i.e "https://yourapi.no/tile") in the developer portal.

### Next step

With all this configurated, you can view the Tile and Micro App in the Preview-module in the developer portal. 

Look at the Tile and Micro App documentation to transform the service into a real and functional UI for your service.

You can send the service to approval when you're confident that the service works as designed. 

Good luck!
