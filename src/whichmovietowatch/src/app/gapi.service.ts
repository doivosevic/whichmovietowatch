import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

declare var gapi;

@Injectable({
  providedIn: 'root'
})
export class GapiService {

  // Client ID and API key from the Developer Console
  CLIENT_ID = '1097533701822-r02tp6adfc0s09705fnaiosdr030po55.apps.googleusercontent.com';
  API_KEY = 'AIzaSyAGJA4dFYvIC8gTmYYwDNlI0iSfBA_Ounc';

    // Array of API discovery doc URLs for APIs used by the quickstart
  DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];

    // Authorization scopes required by the API; multiple scopes can be
    // included, separated by spaces.
  SCOPES = 'https://www.googleapis.com/auth/drive  https://www.googleapis.com/auth/drive.file  https://www.googleapis.com/auth/drive.readonly  https://www.googleapis.com/auth/drive.metadata.readonly  https://www.googleapis.com/auth/drive.appdata  https://www.googleapis.com/auth/drive.metadata  https://www.googleapis.com/auth/drive.photos.readonly';

  isSignedInSubject: BehaviorSubject<boolean>;

  constructor() {
    this.isSignedInSubject = new BehaviorSubject<boolean>(false);
    console.log('loading');
  }

  loadedGapi = this.loadGapi();

  loadGapi(): Promise<any> {
    let t = this;

    return new Promise((resolve, reject) => gapi.load('client:auth2', () => resolve())).then(() => {
      return gapi.client.init({

        apiKey: this.API_KEY,
        clientId: this.CLIENT_ID,
        discoveryDocs: this.DISCOVERY_DOCS,
        scope: this.SCOPES

      }).then(function () {
        // Listen for sign-in state changes.
        gapi.auth2.getAuthInstance().isSignedIn.listen((isIt) => t.isSignedInSubject.next(isIt));

        // Handle the initial sign-in state.
        t.isSignedInSubject.next(gapi.auth2.getAuthInstance().isSignedIn.get());

      }, function (error) {
        console.log(JSON.stringify(error, null, 2));
      });
    });
  }

  public getFiles(): Promise<any[]> {
    console.log(this);
    console.log(GapiService);
    return this.loadedGapi.then(() => gapi.client.drive.files.list({
      'spaces': 'appDataFolder',
      'pageSize': 100,
      'fields': "nextPageToken, files(id, name)"
    }).then(function (response) {
      var files = response.result.files;
      return files;
    }));
  }

  public createFile(content) {
    console.log('create');
    this.loadedGapi.then(() => {
      var fileMetadata = {
        'name': 'wmtwDb',
        'parents': ['appDataFolder']
      };
      var media = {
        mimeType: 'application/text',
        body: JSON.stringify(content)
      };
      console.log('files.create');
      gapi.client.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id'
      }, function (err, file) {
        if (err) {
          console.error(err);
        } else {
          console.log('Folder Id:', file.id);
        }
      }).then(apiResponse => {
        console.log(apiResponse);
        fetch(`https://www.googleapis.com/upload/drive/v3/files/${apiResponse.result.id}`, {
          method: 'PATCH',
          headers: new Headers({
            'Authorization': `Bearer ${gapi.client.getToken().access_token}`,
            'Content-Type': 'application/text'
          }),
          body: JSON.stringify(content)
        })
      }).then(res => console.log(res));

    });
  }

  public signIn() {
    gapi.auth2.getAuthInstance().signIn();
  }

  public signOut() {
    gapi.auth2.getAuthInstance().signOut();
  }
}
