import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { routes } from './app.routes';
import { authInterceptor } from './auth/interceptors/auth.interceptor';

@NgModule({
  declarations: [AppComponent],
  //tells i need functionality provided by these modules
  imports: [
    BrowserModule,
    RouterModule.forRoot(routes)
  ],
  providers: [
    provideHttpClient(
      withInterceptors([authInterceptor])
    )
  ],

  //tells angular this is the first component to load when the application starts
  bootstrap: [AppComponent]
})
export class AppModule {
}
