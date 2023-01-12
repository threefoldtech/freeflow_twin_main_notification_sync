# Notification synchronization for FreeFlow Twin

Notification sync system to receive notifications inside the app from FreeFlow Twin.

**Techstack:**

- [x] Express
- [x] Firebase
- [x] Typescript
- [x] Datastore

There is extra validation that no one can post data to this endpoints only you have your derived seed. This is to precause impersonalisation.


## Endpoints

### Post:

```https://europe-west2-jimberlabs.cloudfunctions.net/api/identify```

```https://europe-west2-jimberlabs.cloudfunctions.net/api/notification```

## Development

Retrieve a service-account.json file from the Google Cloud Console and place it insdide the `````/functions````` folder 


### Run locally

```yarn && yarn serve```

### Deploy to prod

```yarn && yarn deploy```
