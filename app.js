import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { Issuer } from 'openid-client';
import jose from 'node-jose';

const IDP_URL = 'https://idp.smartansatt.telenor.no/idp/.well-known/openid-configuration';

const app = express();
export default app;

Issuer.defaultHttpOptions = { timeout: 25000, retries: 2, followRedirect: true };

/*
  Keystore example
  {
    "keys": [{
      "kty": "RSA",
      "kid": "LD42-RAChzS8NtAcRBnDjCN_itzLaUqXFOgSZuCWc4s",
      "e": "AQAB",
      "n": "iNwOFWB866OAUVAf_tVYGEst6hg75FJleLyzHM_rRYXunpfZr9moTrKEaJ0LgV_1nrbF6Nx2CPl5bqfTCZDq79hjzgcNepGVTDTxhvJCMapL6S2r3LV8m18X0zC8c2bHMdcwIdrTk-bva0ez0dmb6X7xJ5k6tFrlUrs6CiimZi_LjjFmPid6PWxoXl5DHl2Knetbp2yLT2y_3I_G8zGAjDlYEBzkGOpVxPjSp76IvIImO3jdNM4EkbPrNs9xGLp8X-IpxOUy-fZc1Z6w25u-CrfByhKdUrAvU3xNRGH_Z5T7CytrkGL6tx_SZjlGWlLDTsszXv6m1bnHAo2BS-3D0Q",
      "d": "Luk-6pToPN0OXtDYJsF6MNmUI2mrHdggcAI-YuHiAzKlWDc0ptI0nsUSHcm25-G8j2qW6_qleu4IcaWU8PJ7lTrW-wfv1tOQGU8MevUPO3bkDklZX43V6Gvv_rP15JiWLr9UAEbBvzCpYFxzhrrQdnjMsIYVWTzO3kzO2CyW3O-D_64hC30X7OY6sY9C6l2T8-elxGEUKvl8iptsnnE5ZUeg6DUhQZNZR0ilcl23VcT07P5Ptfcxu4d4iz_xgJD04-bTsz9hSfIQYSvekiEYo84BqKnFUeOHKiffnjxb_DslPZUt2JVrZSvJaUOFmdRCuzcuGbgDEY7ixOabNfqAAQ",
      "p": "0NKXafVfHLEIZJVqR8T-hpmQ7Lp-ecleK7o0Wg_wdtWmDrr-MZ0iHE15yCbXMxreMdgMcpEWrbRlEFboiuUhwLKHz86s-5LM4S5_DzSt3xIvml_F94kAg5TL1WNJSuK-v1TrYVh5AsdgojE-Sii2gtOAbPWcQo_MtkTVYDlvYOE",
      "q": "p8dt2hPtKI6ZiPvkzAOq4v9MSH9zQkCdFHPFR8LSop5-y1cOizRvqvDpA_8LU5YDYH3TSq6T4Nyn-JB9LmafatjMOZLPr6N6I-mJY6459vu8-B05KR6N1eQURvGNd1af4VslSeEVrxBNm-j7Li8gqsohdf28gJvIuy6pLSU1kPE",
      "dp": "oVFObyiC5WNNnIZgqDjid5DCiF45vlN1UEp0ju6pUOQTeGW0YReGdl7TqW93557l75N7ajXzUxV8zXaWBlakEHzatgpvT5lEdOC6f0Cu4RjndVZvVJ6dqwiTvrEIubUYri4n9_ek5CSp3iI0gI2bEM3a9FF4-WKlPllGjSNRi4E",
      "dq": "b8kHHwKhw6DnGQbDlU5oQB_bIn6QO7czMVpFOh_LGYBCeJaDYSpJsHoctoXqdQGBNHwBGEQi0PITlCAo146WbqkNwNpZN-vSyDSkTl7Zzf5CFInb-NKbq8Pv4qi0GawEkDCbMpMeUGqrWtKq8EWEHWbZTnUFcCbbYiOfoi2ld_E",
      "qi": "ZR0OCaLeLQECi6G7Puf9cK22U9GgukVBlzUkZCN_ss9lP3KRzdduOXkNYl5FKEza_KPQ0uH9lLEIFJvyCMGQUXNRUAAFpQxNpYEviSQAcoBDZ2Qmc2loAbl-K9XonpFXhbnZDlH4OskQCX8gK_LAf8CcFyhlU7FDjMdUFuqCWWk"
    }]
  }
*/

Issuer
  .discover( IDP_URL )
  .then(issuer => {
    return jose.JWK
      .asKeyStore( process.env.JSON_KEYSTORE )
      .then(keystore => {
        let client = new issuer.Client({
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            userinfo_signed_response_alg: "HS256",
            userinfo_encrypted_response_alg: "RSA1_5",
            userinfo_encrypted_response_enc: "A128CBC-HS256",
            redirect_uris: []
          }, keystore
        );

        client.CLOCK_TOLERANCE = 300;
        
        return client;
      });
  })
  .then(( client )=>{

    // add a health check endpoint
    app.get("/health", (req, res) => res.status(200).end());

    // allow cross-domain access
    app.use(cors());

    // configure the app to parse JSON responses
    app.use(bodyParser.json());

    // Always authorize access to the API
    app.use( authorize(client) );

    // Mount your API here:
    app.get('/tile', getTile );
    app.get('/microapp', getMicroapp );

    // Error handler
    app.use((err, req, res, next) => {
      res.status(err.status || 500);
        
      if(process.env.NODE_ENV !== 'development'){
        res.end();
      }
      else {
        res.json({
          message: err.message,
          error: err,
        });
      }
    });
  })
  .catch((error) => {
    console.error( error );
    process.exit(1);
  });

function authorize( client ){
  return ( req, res, next ) => {
    try {
      const { authorization } = req.headers;
  
      if (!authorization) {
        res.sendStatus(401);
        return;
      }
  
      const accessToken = authorization.substring("Bearer ".length);
  
      if (!accessToken) {
        res.sendStatus(401);
        return;
      }
  
      client
        .userinfo( accessToken )
        .then(( userinfo )=>{
          if( userinfo.success === true ){
            req.user = userinfo;
            next();
          }
          else if( userinfo.success === false ){
            res.json( userinfo );
          }
          else {
            res.status(401);
          }
        })
        .catch(error => {
          console.error( error );
          next( error );
        });
    }
    catch( error ){
      console.error( error );
      next( error )
    }
  }
}

function getTile( req, res, next ){

  const tile = {
    type: "text",
    text: "Hello",
    subtext: "world!",
    onClick: {
      type: "micro-app",
      apiUrl: `${process.env.BASE_URL}/microapp`
    }
  };

  res.json(tile);
}

function getMicroapp( req, res, next ){
  // Read the user ID from the payload from Smart Ansatt
  const { sub: userId } = req.user;

  const microApp = {
    id: "main",
    sections: [
      {
        rows: [
          {
            type: "text",
            title: `Hello ${userId}`
          }
        ]
      }
    ]
  };

  res.json(microApp);
}