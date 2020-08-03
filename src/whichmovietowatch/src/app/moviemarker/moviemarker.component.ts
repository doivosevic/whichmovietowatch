import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { GapiService } from '../gapi.service';

@Component({
  selector: 'app-moviemarker',
  templateUrl: './moviemarker.component.html',
  styleUrls: ['./moviemarker.component.styl']
})
export class MoviemarkerComponent implements OnInit {

  public movieName;
  public movies;
  public currentMovie;
  public currentMovieSearchLink;
  public watchDb = {};
  public currentMovieIter = 0;
  public entries: any[];

  public initialized = false;
  public cfgFileId;
  public dbFileId;


  constructor(private sanitizer: DomSanitizer, private http: HttpClient, public gapiService: GapiService) {
    this.entries = [];

    this.http.get('assets/movies.csv', { responseType: 'text' })
      .subscribe(
        data => {
          var asJson = this.csvJSON(data);
          this.movies = asJson;
          this.currentMovie = this.movies[this.currentMovieIter];
          this.refreshCurrentMovie();
        },
        error => {
          console.log(error);
        }
    );

    this.gapiService.isSignedInSubject.subscribe(isHe => {
      // console.log(isHe);
      // gapiService.getFiles().then(files => {
      //   console.log(files);
      // });
      if (this.initialized == false) {
        this.initialized = true;


        var tryUseExistingDb = new Promise((success, reject) => {

          gapiService.getFileNamed("wmtw.cfg", true).then(cfgFile => {
            if (cfgFile) {
              console.log('found cfg');
              gapiService.downloadFile(cfgFile.id).then(file => {
                file.json().then(content => {
                  console.log(content);
                  let gdriveDbFileId = content;
                  gapiService.downloadFile(gdriveDbFileId).then(dbFile => {
                    if (dbFile.ok) {
                      console.log('found db file');
                      dbFile.json().then(dbFileContent => {

                        console.log(dbFileContent);
                        Object.keys(dbFileContent).forEach(element => {
                          // console.log(element);
                          this.watchDb[element] = dbFileContent[element];
                        });

                        this.refreshEntries();
                        this.cfgFileId = cfgFile.id;
                        this.dbFileId = gdriveDbFileId
                        this.refreshCurrentMovie();

                        console.log(this.watchDb);
                        success(dbFileContent);
                      })
                    }
                    else {
                      console.log("db file missing");
                      console.log(dbFile);
                      reject('no db file');
                    }
                  })
                })
              });
            }
            else {
              reject('no cfg file');
            }
          });
        })

        let resetCfgAndDb = () => {
          console.log('didnt find cfg');

          gapiService.getFiles(true).then(appDataFiles => {
            appDataFiles.forEach(file => {
              gapiService.deleteFile(file.id);
            });

            gapiService.fillNewFile({}, 'wmtwDb').then(onFullfilled => {
              if (onFullfilled) {
                //console.log(onFullfilled);
                onFullfilled.json().then(content => {
                  //console.log(content);
                  let gdriveFileId = content.id;
                  gapiService.fillNewFile(gdriveFileId, "wmtw.cfg", true).then(res => console.log(res));
                })
              }
            });
          });
        }

        tryUseExistingDb.then(success => console.log(success), fail => resetCfgAndDb());
      }
    });
  }

  ngOnInit(): void {
  }

  saveHistory() {
    console.log(this.watchDb);
    this.gapiService.fillNewFile(this.watchDb, 'wmtwDb', false, this.dbFileId);
  }

  watched(has: boolean) {
    this.watchDb[this.currentMovie.imdb_id] = { movie: this.currentMovie, watched: has };
    this.refreshEntries();
    this.refreshCurrentMovie();
  }

  refreshEntries() {
    this.entries = Object.entries(this.watchDb);
  }

  refreshCurrentMovie() {

    while (this.movies[this.currentMovieIter].imdb_id in this.watchDb) {
      this.currentMovieIter++;
    }
    this.currentMovie = this.movies[this.currentMovieIter];

    this.currentMovieSearchLink = this.sanitizer.bypassSecurityTrustResourceUrl(
      "https://www.bing.com/images/search?q=" + this.currentMovie.title + " ");
  }

  removeWatched(movie) {
    console.log(movie);
    delete this.watchDb[movie[0]];
    this.refreshEntries();
    console.log(this.watchDb);
  }

  csvJSON(csv) {

    var lines = csv.split("\n");
    var result = [];
    var headers = lines[0].split(";");

    for (var i = 1; i < lines.length; i++) {

      var obj = {};
      var currentline = lines[i].split(";");

      for (var j = 0; j < headers.length; j++) {
        obj[headers[j]] = currentline[j];
      }

      result.push(obj);

    }

    return result;
  }
}
