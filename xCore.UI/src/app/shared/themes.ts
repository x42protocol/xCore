import { environment } from '../../environments/environment';
import { Theme } from './theme';

export class Themes {
  themes: Theme[];

  constructor() {
    this.themes = this.getThemes();
  }

  getThemes(): Theme[] {
    const themeArray: Theme[] = [];
    let basePath = '../assets/themes/';
    const prodBasePath = '../../src/assets/themes/';
    const endPath = '/theme.css';

    if (environment.production) {
      basePath = prodBasePath;
    }
    themeArray.push(new Theme('Rhea', basePath + 'rhea' + endPath, '#666666', '#FCFCFC !important', 'light'));
    themeArray.push(new Theme('Nova-Colored', basePath + 'nova-colored' + endPath, '#666666', '#FCFCFC !important', 'light'));
    themeArray.push(new Theme('Nova-Dark', basePath + 'nova-dark' + endPath, '#666666', '#FCFCFC !important', 'light'));
    themeArray.push(new Theme('Nova-light', basePath + 'nova-light' + endPath, '#666666', '#FCFCFC !important', 'light'));
    themeArray.push(new Theme('Luna-amber', basePath + 'luna-amber' + endPath, '#dedede', '#3f3f3f !important', 'dark'));
    themeArray.push(new Theme('Luna-blue', basePath + 'luna-blue' + endPath, '#dedede', '#3f3f3f !important', 'dark'));
    themeArray.push(new Theme('Luna-green', basePath + 'luna-green' + endPath, '#dedede', '#3f3f3f !important', 'dark'));
    themeArray.push(new Theme('Luna-pink', basePath + 'luna-pink' + endPath, '#dedede', '#3f3f3f !important', 'dark'));
    themeArray.push(new Theme('x42Dark', basePath + 'x42Dark' + endPath, '#dedede', '#1E1E1E !important', 'dark'));

    return themeArray;
  }
}
