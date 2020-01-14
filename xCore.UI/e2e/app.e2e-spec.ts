import { AngularElectronPage } from './app.po';
import { browser, element, by } from 'protractor';

describe('x42 App', () => {
  let page: AngularElectronPage;

  beforeEach(() => {
    page = new AngularElectronPage();
  });

  it('Page title should be x42', () => {
    page.navigateTo('/');
    expect(page.getTitle()).toEqual('x42');
  });
});
