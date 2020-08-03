import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MoviemarkerComponent } from './moviemarker/moviemarker.component';

const routes: Routes = [
  { path: '**', component: MoviemarkerComponent },  // Wildcard route for a 404 page
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
