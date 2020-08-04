import { Injectable, isDevMode } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

declare var gapi;

@Injectable({
  providedIn: 'root'
})
export class GapiService {

  CLIENT_ID_PROD = '1097533701822-41e8b1omqclkpulte78giltbqh1b782h.apps.googleusercontent.com';
  CLIENT_ID_DEV = '1097533701822-r02tp6adfc0s09705fnaiosdr030po55.apps.googleusercontent.com';
  API_KEY = 'AIzaSyAGJA4dFYvIC8gTmYYwDNlI0iSfBA_Ounc';

  // Array of API discovery doc URLs for APIs used by the quickstart
  DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];

  SCOPES = 'https://www.googleapis.com/auth/drive  https://www.googleapis.com/auth/drive.file  https://www.googleapis.com/auth/drive.readonly  https://www.googleapis.com/auth/drive.metadata.readonly  https://www.googleapis.com/auth/drive.appdata  https://www.googleapis.com/auth/drive.metadata  https://www.googleapis.com/auth/drive.photos.readonly';

  isSignedInSubject: BehaviorSubject<boolean>;

  constructor() {
    this.isSignedInSubject = new BehaviorSubject<boolean>(false);
  }

  loadedGapi = this.loadGapi();

  loadGapi(): Promise<any> {
    let t = this;

    return new Promise((resolve, reject) => gapi.load('client:auth2', () => resolve())).then(() => {
      return gapi.client.init({

        apiKey: this.API_KEY,
        clientId: isDevMode() ? this.CLIENT_ID_DEV : this.CLIENT_ID_PROD,
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

  public getFiles(fromAppData: boolean = false): Promise<any[]> {
    let metadata = {
      //'spaces': 'appDataFolder',
      'pageSize': 100,
      'fields': "nextPageToken, files(name,id)"
    };
    if (fromAppData) metadata['spaces'] = 'appDataFolder';
    //console.log(metadata);

    return this.loadedGapi.then(() => gapi.client.drive.files.list(metadata).then(function (response) {
      var files = response.result.files;
      return files;
    }));
  }

  public getFileNamed(name: string, fromAppdata: boolean = false): Promise<any> {
    return this.getFiles(fromAppdata).then(files => {
      console.log(files);
      let res = files.find(file => {
        return file.name == name;
      });

      return res;
    });
  }

  public fillNewFile(content, name: string, inAppdata: boolean = false, id: string = undefined): Promise<void | Response> {

    var fileMetadata = {
      'name': name,
      'mimeType': "application/json", // mimeType at Google Drive
      //'parents': ['appDataFolder']
    };
    if (inAppdata) fileMetadata['parents'] = ['appDataFolder'];
    // if (id) fileMetadata['id'] = id;

    console.log(fileMetadata);

    var form = new FormData();
    form.append("metadata", new Blob([JSON.stringify(fileMetadata)], { type: "application/json" }));
    form.append("file", JSON.stringify(content));

    return fetch("https://www.googleapis.com/upload/drive/v3/files/" + (id ? id + '/' : '') + "?uploadType=multipart" + (id ? "" : "&fields=id"), {
      method: id ? 'PATCH' : 'POST',
      headers: new Headers({ 'Authorization': `Bearer ${gapi.client.getToken().access_token}` }),
      body: form
    }).then(res => { console.log(res); return res; });
  }

  public downloadFile(fileId): Promise<Response> {

    return fetch("https://www.googleapis.com/drive/v3/files/" + fileId + "?alt=media" , {
      method: 'GET',
      headers: new Headers({ 'Authorization': `Bearer ${gapi.client.getToken().access_token}` })
    });
  }

  public deleteFile(fileId): Promise<Response> {

    return fetch("https://www.googleapis.com/drive/v3/files/" + fileId, {
      method: 'DELETE',
      headers: new Headers({ 'Authorization': `Bearer ${gapi.client.getToken().access_token}` })
    });
  }

  public signIn() {
    gapi.auth2.getAuthInstance().signIn();
  }

  public signOut() {
    gapi.auth2.getAuthInstance().signOut();
  }
}
