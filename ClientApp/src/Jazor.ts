// HTML Attributes:
// data-jazor-click    - HTTP request action
// data-jazor-confirm  - show confirmation windows before action
// data-jazor-delay    - delay HTTP request action - seconds
// data-jazor-method   - HTTP method used get, post
// data-jazor-enable-default - preventDefault is used be default
// data-jazor-refresh  - repeat HTTP request - seconds
// data-jazor-id       - id sent over
// data-jazor-temp     - saved initial state, return on fail
// data-jazor-response - show response messages
// data-jazor-target   - render HTML to this element
// data-jazor-url      - load Html from this url, it should be triggered immediately 
//                  unless delayed

// data-jazor-processed - internal - flag element that click listener was added
// data-jazor-refresh-running - internal - flag element that refresh is running

export class Jazor {

  debug = false;
  successCallback?: ISuccess;
  failCallback?: IFail;
  responseElement: HTMLElement;
  //refreshQueue: string[];
  progressHtml = ' <span class="spinner-border spinner-border-sm"></span>';
  //selector?: string;
  private prefix = 'data-jazor-';

  // process click events and call url from this attribute, fires only on click
  private clickAttribute = this.prefix + 'click';

  // show confirm windows, hook it to bootstrap modal
  private confirmAttribute = this.prefix + 'confirm';

  // seconds delay API load, makes sense only for urlAttribute
  private delayAttribute = this.prefix + 'delay';

  // method used get/post
  private methodAttribute = this.prefix + 'method';

  // preventDefault is default unless enabled
  private enableDefaultAttribute = this.prefix + 'enable-default';

  // flag element so we know that click listener was added
  private processedFlagAttribute = this.prefix + 'processed';

  // refresh this call in x seconds
  private refreshAttribute = this.prefix + 'refresh';

  // refresh flag
  private refreshRunningAttribute = this.prefix + 'refresh-running';

  // element to show some log information
  private responseAttribute = this.prefix + 'response';

  // element to render url response
  private targetAttribute = this.prefix + 'target';

  // save checkbox current value and reuse if fail
  private temporaryValueAttribute = this.prefix + 'temp';

  // load Html from this url, it should be triggered immediately unless delayed
  private urlAttribute = this.prefix + 'url';

  private defaultContentType = 'application/json';
  //private contentType = undefined;

  constructor() {
    this.responseElement = document.querySelectorAll<HTMLElement>(`[${this.responseAttribute}]`)[0];
    //this.progressHtml = ` ${progressHtml}`;
  }

  init(eventName = 'click') {

    const clickElementsToProcess = document.querySelectorAll<HTMLElement>(`[${this.clickAttribute}]:not([value=""])`);
    const urlElementsToProcess = document.querySelectorAll<HTMLElement>(`[${this.urlAttribute}]:not([value=""])`);

    if (clickElementsToProcess.length === 0 && urlElementsToProcess.length === 0) {
      this.log(`Attributes ${this.clickAttribute} or ${this.urlAttribute} are not used or missing.`);
    }

    urlElementsToProcess.forEach(async (element) => {

      const delay = parseFloat(element.getAttribute(this.delayAttribute));

      //if (element.hasAttribute(this.refreshAttribute))
      //    this.refreshQueue.push(element);

      if (isNaN(delay)) {
        await this.fetchAndParse(element, 'text/html');
        return;
      }

      setTimeout(async function () { await this.fetchAndParse(element, 'text/html') }.bind(this), delay * 1000);

    });

    clickElementsToProcess.forEach((element) => {

      this.attacheEvents(element, eventName);

    });


    this.monitorNewClicks();

    //process the Queue
    //this.refreshQueue.forEach((element) => {

    //});
  }

  private attacheEvents(element: HTMLElement, eventName = 'click') {

    // click was already attached
    if (element.hasAttribute(this.processedFlagAttribute)) return;

    element.setAttribute(this.processedFlagAttribute, '');

    const inputElement = element as HTMLInputElement;

    if (inputElement.type === 'checkbox') {

      element.setAttribute(this.temporaryValueAttribute, inputElement.checked.toString());

      // this is also for change event for MaterialDesign or https://github.com/minhur/bootstrap-toggle

      element.addEventListener(eventName, () => {
        if (inputElement.checked.toString() !== element.getAttribute(this.temporaryValueAttribute)) {

          if (this.debug) console.log('Sending a request, state: ' + inputElement.checked);

          this.send(element);
        }
      });

    } else if (inputElement.type === 'submit' || element.getAttribute(this.confirmAttribute) !== null) {

      element.onclick = (event) => {

        this.processClick(element, event);

        //event.preventDefault();

        //if (confirm('Do you want to proceed with this action?')) {
        //  this.send(element);
        //}
      };
    } else if (inputElement.type === 'button') {

      element.onclick = (event) => { this.processClick(element, event); };

    } else
      element.onclick = (event) => {
        this.processClick(element, event);
        //if (element.tagName === 'A') event.preventDefault();
        //this.send(element);
      };
  }

  private processClick(element: HTMLElement, event: MouseEvent) {

    if (!element.hasAttribute(this.enableDefaultAttribute)) event.preventDefault();

    if (element.getAttribute(this.confirmAttribute) === null) {

      this.send(element); return;
    }

    if (confirm('Do you want to proceed with this action?')) this.send(element);
  }

  private monitorNewClicks() {

    document.addEventListener('click', async (e: MouseEvent) => {

      const element = e.target as HTMLElement;

      if (element.hasAttribute(this.processedFlagAttribute)) return;

      if (!element.hasAttribute(this.urlAttribute) && !element.hasAttribute(this.clickAttribute)) return;

      if (element.hasAttribute(this.clickAttribute)) {

        this.attacheEvents(element);

        this.processClick(element, e);
      }

      //element.setAttribute(this.processedFlagAttribute, '');

      //if (element.tagName === 'A') event.preventDefault();

      //element.onclick = async (event) => {
      //  event.preventDefault();
      //  return this.fetchAndParse(element, 'text/html');
      //  //return false;
      //};

      if (element.hasAttribute(this.urlAttribute)) await this.fetchAndParse(element, 'text/html');
    });
  }

  private send(element: HTMLElement, contentType: string = this.defaultContentType) {

    const data = element.getAttribute('data-ajax-id');
    const method = element.getAttribute(this.methodAttribute) || 'get';

    //if (method === 'post' && data === null) {
    //  this.log('data-ajax-id is missing');
    //  return;
    //}

    if ((element as HTMLInputElement).type === 'button') {

      (element as HTMLInputElement).disabled = true;
      if (this.progressHtml) element.innerHTML += this.progressHtml;
    }

    if (method === 'get' || method === 'delete') {
      this.ajaxSend(method, contentType, element, '', this.success, this.fail);
      return;
    }

    if (data === null) return;

    if (data.startsWith('{') && data.endsWith('}')) {
      this.ajaxSend(method, contentType, element, data, this.success, this.fail);
      return;
    }

    //this.ajaxSend(method, element, JSON.stringify({ id: data }), this.success, this.fail);

    //else
    //  this.ajaxSend(method, element, '', this.success, this.fail);

  }

  private async fetchAndParse(element: HTMLElement, contentType: string = this.defaultContentType) {

    const url = element.getAttribute(this.urlAttribute);

    if (!url) {
      this.log('Fetch url is missing'); return;
    }

    return await fetch(url,
      {
        headers: { 'Content-Type': contentType }
      })
      .then(this.handleErrors)
      //.then((response) => {
      //    if (!response.ok) throw Error(`Status: ${response.status}, ${response.statusText}`);
      //    return response;
      //})
      .then((response) => {

        const contentType = response.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
          return response.json().then((json) => { this.processJsonResponse(json, element); });
        } else {
          return response.text().then((html) => { this.processHtmlResponse(html, element); });
        }
      })
      //.then((html) => { return { html, element } });
      //.then((html) => { this.processHtmlResponse(html, element); })
      .catch(error => { this.logError(error); });
  }

  private handleErrors(response) {

    if (!response.ok) throw Error(`Status: ${response.status}, ${response.statusText}`);

    return response;
  }

  private ajaxSend(method: string, contentType: string, element: HTMLElement, data: string, success: Function, fail: Function) {

    const url = element.getAttribute(this.clickAttribute);

    if (!url) {
      this.log('Click url is missing'); return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.setRequestHeader('Content-Type', contentType || this.defaultContentType);
    xhr.onload = () => {
      if (xhr.status === 200) this.success(xhr, element, contentType);
      else this.fail(xhr, element);
    }

    xhr.send(data);
  }

  private fail(xhr: XMLHttpRequest, element: HTMLElement) {

    this.logError(`There was a problem with this action. Returned status of ${xhr.status}, ${xhr.response}`);

    if ((element as HTMLInputElement).type === 'checkbox') {

      // return previous state from data-ajax-temp
      (element as HTMLInputElement).checked = element.getAttribute(this.temporaryValueAttribute) === 'true';

    } else if ((element as HTMLInputElement).type === 'submit' || (element as HTMLInputElement).type === 'button') {
      (element as HTMLInputElement).disabled = false;
      element.innerHTML = element.innerHTML.replace(this.progressHtml, '');
    }

    if (this.failCallback !== undefined) this.failCallback(xhr, element);
  }

  private success(xhr: XMLHttpRequest, element: HTMLElement, contentType: string) {

    const responseContentType = xhr.getAllResponseHeaders();

    if (responseContentType.includes("application/json"))
      this.processJsonResponse(JSON.parse(xhr.response), element);
    else this.processHtmlResponse(xhr.response, element);

    //const jsonResponse = JSON.parse(xhr.response);
    //console.log(jsonResponse);
    //this.removeElement(element);

    if ((element as HTMLInputElement).type === 'checkbox') {

      element.setAttribute(this.temporaryValueAttribute, (element as HTMLInputElement).checked.toString());

    } else if ((element as HTMLInputElement).type === 'submit') { }

    if (this.successCallback !== undefined) this.successCallback(element);
  }

  private processJsonResponse(actions: IResponseAction[], element: HTMLElement) {
    actions.forEach(action => {
      if (action.type === 'log') this.log(action.html);
      else if (action.type === 'removeElement') this.removeElement(element, action.selector);
      else if (action.type === 'updateElement') this.updateElement(element, action);
    });
  }

  private processHtmlResponse(response: string, element: HTMLElement) {

    //const divTag = document.createElement('div');
    //divTag.innerHTML = response;
    //element.appendChild(document.importNode(divTag, true));
    //element.firstElementChild.remove();

    if (element.hasAttribute(this.targetAttribute)) {
      const newElement = document.getElementById(element.getAttribute(this.targetAttribute));

      if (newElement === null) return;
      const url = element.getAttribute(this.urlAttribute);
      element = newElement;
      element.setAttribute(this.urlAttribute, url);
    }

    element.innerHTML = response;

    const scripts = element.querySelectorAll<HTMLElement>(`script`);

    scripts.forEach((script) => {
      // ideally we don't want to use eval but let's try it
      //eval(script.innerText);
      const scriptTag = document.createElement('script');
      scriptTag.innerHTML = script.textContent;
      script.remove();
      element.appendChild(scriptTag);
      element.classList.add('transition-end');
    });

    if (scripts.length === 0)
      element.classList.add('transition-end');

    // refresh fetch 
    if (element.hasAttribute(this.refreshAttribute) && !element.hasAttribute(this.refreshRunningAttribute)) {

      const refreshIn = +element.getAttribute(this.refreshAttribute);

      if (isNaN(+refreshIn)) return;

      element.setAttribute(this.refreshRunningAttribute, '');

      setTimeout(async function () {

        element.removeAttribute(this.refreshRunningAttribute);

        await this.fetchAndParse(element, 'text/html');

      }.bind(this), +refreshIn * 1000);
    }
  }

  private removeElement(element: HTMLElement, selector: string) {
    element.closest(selector).remove();
  }

  private updateElement(element: HTMLElement, action: IResponseAction) {

    const selectedElement = document.getElementById(action.selector) as HTMLInputElement;

    if (selectedElement.type === 'checkbox') {
      selectedElement.checked = action.html === 'true';
    }
    else selectedElement.outerHTML = action.html;
  }

  private logError = (text: string) => {
    if (this.responseElement !== undefined)
      this.responseElement.innerHTML = `<p class="text-danger">${text}</p>` + this.responseElement.innerHTML;
    console.log(text);
  }

  private log = (text: string) => {
    if (this.responseElement !== undefined)
      this.responseElement.innerHTML = `<p>${text}</p>` + this.responseElement.innerHTML;
    console.log(text);
  }
}

interface ISuccess {
  (element: HTMLElement): void;
}

interface IFail {
  (xhr: XMLHttpRequest, element: HTMLElement): void;
}

interface IResponseAction {
  type: string;
  selector: string;
  html: string;
}