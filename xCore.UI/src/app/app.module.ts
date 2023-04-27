import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { SharedModule } from './shared/shared.module';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { SetupModule } from './setup/setup.module';
import { WalletModule } from './wallet/wallet.module';
import { ThemeService } from './shared/services/theme.service';
import { MainMenuModule } from './shared/components/main-menu/main-menu.module';
import { ShutdownModule } from './shared/components/shutdown/shutdown.module';
import { HttpErrorHandler } from './shared/services/http-error-handler.service';
import { SimpleTimer } from 'ng2-simple-timer';
import { httpInterceptorProviders } from './shared/http-interceptors/index';
import { APP_TITLE } from './shared/services/title.service';

// PrimeNG Components.
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { StepsModule } from 'primeng/steps';
import { InputTextModule } from 'primeng/inputtext';
import { MenubarModule } from 'primeng/menubar';
import { SidebarModule } from 'primeng/sidebar';
import { DropdownModule } from 'primeng/dropdown';
import { FieldsetModule } from 'primeng/fieldset';
import { DialogModule } from 'primeng/dialog';
import { MessagesModule } from 'primeng/messages';
import { MessageModule } from 'primeng/message';
import { BlockUIModule } from 'primeng/blockui';
import { PanelModule } from 'primeng/panel';
import { DynamicDialogModule, DialogService } from 'primeng/dynamicdialog';
import { TableModule } from 'primeng/table';
import { CalendarModule } from 'primeng/calendar';
import { SplitButtonModule } from 'primeng/splitbutton';
import { SlideMenuModule } from 'primeng/slidemenu';
import { ContextMenuModule } from 'primeng/contextmenu';
import { ProgressBarModule } from 'primeng/progressbar';
import { ToolbarModule } from 'primeng/toolbar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    SharedModule,
    SetupModule,
    WalletModule,
    AppRoutingModule,
    ButtonModule,
    StepsModule,
    InputTextModule,
    MenubarModule,
    SidebarModule,
    DropdownModule,
    FieldsetModule,
    DialogModule,
    MessagesModule,
    MessageModule,
    BlockUIModule,
    PanelModule,
    DynamicDialogModule,
    MainMenuModule,
    TableModule,
    CalendarModule,
    SplitButtonModule,
    SlideMenuModule,
    ContextMenuModule,
    ProgressBarModule,
    ToolbarModule,
    ShutdownModule,
    ProgressSpinnerModule,
  ],
  declarations: [
    AppComponent,
    LoginComponent],
  providers: [
    HttpErrorHandler,
    httpInterceptorProviders,
    ThemeService,
    MessageService,
    DialogService,
    { provide: APP_TITLE, useValue: 'xCore' },
    SimpleTimer,
  ],
  bootstrap: [AppComponent]
})

export class AppModule { }
