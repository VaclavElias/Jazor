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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// data-jazor-processed - internal - flag element that click listener was added
// data-jazor-refresh-running - internal - flag element that refresh is running
export class Jazor {
    //private contentType = undefined;
    constructor() {
        this.debug = false;
        //refreshQueue: string[];
        this.progressHtml = ' <span class="spinner-border spinner-border-sm"></span>';
        //selector?: string;
        this.prefix = 'data-jazor-';
        // process click events and call url from this attribute, fires only on click
        this.clickAttribute = this.prefix + 'click';
        // show confirm windows, hook it to bootstrap modal
        this.confirmAttribute = this.prefix + 'confirm';
        // seconds delay API load, makes sense only for urlAttribute
        this.delayAttribute = this.prefix + 'delay';
        // method used get/post
        this.methodAttribute = this.prefix + 'method';
        // preventDefault is default unless enabled
        this.enableDefaultAttribute = this.prefix + 'enable-default';
        // flag element so we know that click listener was added
        this.processedFlagAttribute = this.prefix + 'processed';
        // refresh this call in x seconds
        this.refreshAttribute = this.prefix + 'refresh';
        // refresh flag
        this.refreshRunningAttribute = this.prefix + 'refresh-running';
        // element to show some log information
        this.responseAttribute = this.prefix + 'response';
        // element to render url response
        this.targetAttribute = this.prefix + 'target';
        // save checkbox current value and reuse if fail
        this.temporaryValueAttribute = this.prefix + 'temp';
        // load Html from this url, it should be triggered immediately unless delayed
        this.urlAttribute = this.prefix + 'url';
        this.defaultContentType = 'application/json';
        this.logError = (text) => {
            if (this.responseElement !== undefined)
                this.responseElement.innerHTML = `<p class="text-danger">${text}</p>` + this.responseElement.innerHTML;
            console.log(text);
        };
        this.log = (text) => {
            if (this.responseElement !== undefined)
                this.responseElement.innerHTML = `<p>${text}</p>` + this.responseElement.innerHTML;
            console.log(text);
        };
        this.responseElement = document.querySelectorAll(`[${this.responseAttribute}]`)[0];
        //this.progressHtml = ` ${progressHtml}`;
    }
    init(eventName = 'click') {
        const clickElementsToProcess = document.querySelectorAll(`[${this.clickAttribute}]:not([value=""])`);
        const urlElementsToProcess = document.querySelectorAll(`[${this.urlAttribute}]:not([value=""])`);
        if (clickElementsToProcess.length === 0 && urlElementsToProcess.length === 0) {
            this.log(`Attributes ${this.clickAttribute} or ${this.urlAttribute} are not used or missing.`);
        }
        urlElementsToProcess.forEach((element) => __awaiter(this, void 0, void 0, function* () {
            const delay = parseFloat(element.getAttribute(this.delayAttribute));
            //if (element.hasAttribute(this.refreshAttribute))
            //    this.refreshQueue.push(element);
            if (isNaN(delay)) {
                yield this.fetchAndParse(element, 'text/html');
                return;
            }
            setTimeout(function () {
                return __awaiter(this, void 0, void 0, function* () { yield this.fetchAndParse(element, 'text/html'); });
            }.bind(this), delay * 1000);
        }));
        clickElementsToProcess.forEach((element) => {
            this.attacheEvents(element, eventName);
        });
        this.monitorNewClicks();
        //process the Queue
        //this.refreshQueue.forEach((element) => {
        //});
    }
    attacheEvents(element, eventName = 'click') {
        // click was already attached
        if (element.hasAttribute(this.processedFlagAttribute))
            return;
        element.setAttribute(this.processedFlagAttribute, '');
        const inputElement = element;
        if (inputElement.type === 'checkbox') {
            element.setAttribute(this.temporaryValueAttribute, inputElement.checked.toString());
            // this is also for change event for MaterialDesign or https://github.com/minhur/bootstrap-toggle
            element.addEventListener(eventName, () => {
                if (inputElement.checked.toString() !== element.getAttribute(this.temporaryValueAttribute)) {
                    if (this.debug)
                        console.log('Sending a request, state: ' + inputElement.checked);
                    this.send(element);
                }
            });
        }
        else if (inputElement.type === 'submit' || element.getAttribute(this.confirmAttribute) !== null) {
            element.onclick = (event) => {
                this.processClick(element, event);
                //event.preventDefault();
                //if (confirm('Do you want to proceed with this action?')) {
                //  this.send(element);
                //}
            };
        }
        else if (inputElement.type === 'button') {
            element.onclick = (event) => { this.processClick(element, event); };
        }
        else
            element.onclick = (event) => {
                this.processClick(element, event);
                //if (element.tagName === 'A') event.preventDefault();
                //this.send(element);
            };
    }
    processClick(element, event) {
        if (!element.hasAttribute(this.enableDefaultAttribute))
            event.preventDefault();
        if (element.getAttribute(this.confirmAttribute) === null) {
            this.send(element);
            return;
        }
        if (confirm('Do you want to proceed with this action?'))
            this.send(element);
    }
    monitorNewClicks() {
        document.addEventListener('click', (e) => __awaiter(this, void 0, void 0, function* () {
            const element = e.target;
            if (element.hasAttribute(this.processedFlagAttribute))
                return;
            if (!element.hasAttribute(this.urlAttribute) && !element.hasAttribute(this.clickAttribute))
                return;
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
            if (element.hasAttribute(this.urlAttribute))
                yield this.fetchAndParse(element, 'text/html');
        }));
    }
    send(element, contentType = this.defaultContentType) {
        const data = element.getAttribute('data-ajax-id');
        const method = element.getAttribute(this.methodAttribute) || 'get';
        //if (method === 'post' && data === null) {
        //  this.log('data-ajax-id is missing');
        //  return;
        //}
        if (element.type === 'button') {
            element.disabled = true;
            if (this.progressHtml)
                element.innerHTML += this.progressHtml;
        }
        if (method === 'get' || method === 'delete') {
            this.ajaxSend(method, contentType, element, '', this.success, this.fail);
            return;
        }
        if (data === null)
            return;
        if (data.startsWith('{') && data.endsWith('}')) {
            this.ajaxSend(method, contentType, element, data, this.success, this.fail);
            return;
        }
        //this.ajaxSend(method, element, JSON.stringify({ id: data }), this.success, this.fail);
        //else
        //  this.ajaxSend(method, element, '', this.success, this.fail);
    }
    fetchAndParse(element, contentType = this.defaultContentType) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = element.getAttribute(this.urlAttribute);
            if (!url) {
                this.log('Fetch url is missing');
                return;
            }
            return yield fetch(url, {
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
                }
                else {
                    return response.text().then((html) => { this.processHtmlResponse(html, element); });
                }
            })
                //.then((html) => { return { html, element } });
                //.then((html) => { this.processHtmlResponse(html, element); })
                .catch(error => { this.logError(error); });
        });
    }
    handleErrors(response) {
        if (!response.ok)
            throw Error(`Status: ${response.status}, ${response.statusText}`);
        return response;
    }
    ajaxSend(method, contentType, element, data, success, fail) {
        const url = element.getAttribute(this.clickAttribute);
        if (!url) {
            this.log('Click url is missing');
            return;
        }
        const xhr = new XMLHttpRequest();
        xhr.open(method, url);
        xhr.setRequestHeader('Content-Type', contentType || this.defaultContentType);
        xhr.onload = () => {
            if (xhr.status === 200)
                this.success(xhr, element, contentType);
            else
                this.fail(xhr, element);
        };
        xhr.send(data);
    }
    fail(xhr, element) {
        this.logError(`There was a problem with this action. Returned status of ${xhr.status}, ${xhr.response}`);
        if (element.type === 'checkbox') {
            // return previous state from data-ajax-temp
            element.checked = element.getAttribute(this.temporaryValueAttribute) === 'true';
        }
        else if (element.type === 'submit' || element.type === 'button') {
            element.disabled = false;
            element.innerHTML = element.innerHTML.replace(this.progressHtml, '');
        }
        if (this.failCallback !== undefined)
            this.failCallback(xhr, element);
    }
    success(xhr, element, contentType) {
        const responseContentType = xhr.getAllResponseHeaders();
        if (responseContentType.includes("application/json"))
            this.processJsonResponse(JSON.parse(xhr.response), element);
        else
            this.processHtmlResponse(xhr.response, element);
        //const jsonResponse = JSON.parse(xhr.response);
        //console.log(jsonResponse);
        //this.removeElement(element);
        if (element.type === 'checkbox') {
            element.setAttribute(this.temporaryValueAttribute, element.checked.toString());
        }
        else if (element.type === 'submit') { }
        if (this.successCallback !== undefined)
            this.successCallback(element);
    }
    processJsonResponse(actions, element) {
        actions.forEach(action => {
            if (action.type === 'log')
                this.log(action.html);
            else if (action.type === 'removeElement')
                this.removeElement(element, action.selector);
            else if (action.type === 'updateElement')
                this.updateElement(element, action);
        });
    }
    processHtmlResponse(response, element) {
        //const divTag = document.createElement('div');
        //divTag.innerHTML = response;
        //element.appendChild(document.importNode(divTag, true));
        //element.firstElementChild.remove();
        if (element.hasAttribute(this.targetAttribute)) {
            const newElement = document.getElementById(element.getAttribute(this.targetAttribute));
            if (newElement === null)
                return;
            const url = element.getAttribute(this.urlAttribute);
            element = newElement;
            element.setAttribute(this.urlAttribute, url);
        }
        element.innerHTML = response;
        const scripts = element.querySelectorAll(`script`);
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
            if (isNaN(+refreshIn))
                return;
            element.setAttribute(this.refreshRunningAttribute, '');
            setTimeout(function () {
                return __awaiter(this, void 0, void 0, function* () {
                    element.removeAttribute(this.refreshRunningAttribute);
                    yield this.fetchAndParse(element, 'text/html');
                });
            }.bind(this), +refreshIn * 1000);
        }
    }
    removeElement(element, selector) {
        element.closest(selector).remove();
    }
    updateElement(element, action) {
        const selectedElement = document.getElementById(action.selector);
        if (selectedElement.type === 'checkbox') {
            selectedElement.checked = action.html === 'true';
        }
        else
            selectedElement.outerHTML = action.html;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSmF6b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9DbGllbnRBcHAvc3JjL0phem9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLG1CQUFtQjtBQUNuQiw0Q0FBNEM7QUFDNUMsZ0VBQWdFO0FBQ2hFLDREQUE0RDtBQUM1RCxtREFBbUQ7QUFDbkQsZ0VBQWdFO0FBQ2hFLHNEQUFzRDtBQUN0RCxxQ0FBcUM7QUFDckMsNERBQTREO0FBQzVELCtDQUErQztBQUMvQyxvREFBb0Q7QUFDcEQscUZBQXFGO0FBQ3JGLGtDQUFrQzs7Ozs7Ozs7OztBQUVsQywrRUFBK0U7QUFDL0UsK0VBQStFO0FBRS9FLE1BQU0sT0FBTyxLQUFLO0lBZ0RoQixrQ0FBa0M7SUFFbEM7UUFoREEsVUFBSyxHQUFHLEtBQUssQ0FBQztRQUlkLHlCQUF5QjtRQUN6QixpQkFBWSxHQUFHLHlEQUF5RCxDQUFDO1FBQ3pFLG9CQUFvQjtRQUNaLFdBQU0sR0FBRyxhQUFhLENBQUM7UUFFL0IsNkVBQTZFO1FBQ3JFLG1CQUFjLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxPQUFPLENBQUM7UUFFL0MsbURBQW1EO1FBQzNDLHFCQUFnQixHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsU0FBUyxDQUFDO1FBRW5ELDREQUE0RDtRQUNwRCxtQkFBYyxHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsT0FBTyxDQUFDO1FBRS9DLHVCQUF1QjtRQUNmLG9CQUFlLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxRQUFRLENBQUM7UUFFakQsMkNBQTJDO1FBQ25DLDJCQUFzQixHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsZ0JBQWdCLENBQUM7UUFFaEUsd0RBQXdEO1FBQ2hELDJCQUFzQixHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsV0FBVyxDQUFDO1FBRTNELGlDQUFpQztRQUN6QixxQkFBZ0IsR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLFNBQVMsQ0FBQztRQUVuRCxlQUFlO1FB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USxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFxQixDQUFDO1FBRXJGLElBQUksZUFBZSxDQUFDLElBQUksS0FBSyxVQUFVLEVBQUU7WUFDdkMsZUFBZSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUMsSUFBSSxLQUFLLE1BQU0sQ0FBQztTQUNsRDs7WUFDSSxlQUFlLENBQUMsU0FBUyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDL0MsQ0FBQztDQWFGIiwic291cmNlc0NvbnRlbnQiOlsiLy8gSFRNTCBBdHRyaWJ1dGVzOlxyXG4vLyBkYXRhLWphem9yLWNsaWNrICAgIC0gSFRUUCByZXF1ZXN0IGFjdGlvblxyXG4vLyBkYXRhLWphem9yLWNvbmZpcm0gIC0gc2hvdyBjb25maXJtYXRpb24gd2luZG93cyBiZWZvcmUgYWN0aW9uXHJcbi8vIGRhdGEtamF6b3ItZGVsYXkgICAgLSBkZWxheSBIVFRQIHJlcXVlc3QgYWN0aW9uIC0gc2Vjb25kc1xyXG4vLyBkYXRhLWphem9yLW1ldGhvZCAgIC0gSFRUUCBtZXRob2QgdXNlZCBnZXQsIHBvc3RcclxuLy8gZGF0YS1qYXpvci1lbmFibGUtZGVmYXVsdCAtIHByZXZlbnREZWZhdWx0IGlzIHVzZWQgYmUgZGVmYXVsdFxyXG4vLyBkYXRhLWphem9yLXJlZnJlc2ggIC0gcmVwZWF0IEhUVFAgcmVxdWVzdCAtIHNlY29uZHNcclxuLy8gZGF0YS1qYXpvci1pZCAgICAgICAtIGlkIHNlbnQgb3ZlclxyXG4vLyBkYXRhLWphem9yLXRlbXAgICAgIC0gc2F2ZWQgaW5pdGlhbCBzdGF0ZSwgcmV0dXJuIG9uIGZhaWxcclxuLy8gZGF0YS1qYXpvci1yZXNwb25zZSAtIHNob3cgcmVzcG9uc2UgbWVzc2FnZXNcclxuLy8gZGF0YS1qYXpvci10YXJnZXQgICAtIHJlbmRlciBIVE1MIHRvIHRoaXMgZWxlbWVudFxyXG4vLyBkYXRhLWphem9yLXVybCAgICAgIC0gbG9hZCBIdG1sIGZyb20gdGhpcyB1cmwsIGl0IHNob3VsZCBiZSB0cmlnZ2VyZWQgaW1tZWRpYXRlbHkgXHJcbi8vICAgICAgICAgICAgICAgICAgdW5sZXNzIGRlbGF5ZWRcclxuXHJcbi8vIGRhdGEtamF6b3ItcHJvY2Vzc2VkIC0gaW50ZXJuYWwgLSBmbGFnIGVsZW1lbnQgdGhhdCBjbGljayBsaXN0ZW5lciB3YXMgYWRkZWRcclxuLy8gZGF0YS1qYXpvci1yZWZyZXNoLXJ1bm5pbmcgLSBpbnRlcm5hbCAtIGZsYWcgZWxlbWVudCB0aGF0IHJlZnJlc2ggaXMgcnVubmluZ1xyXG5cclxuZXhwb3J0IGNsYXNzIEphem9yIHtcclxuXHJcbiAgZGVidWcgPSBmYWxzZTtcclxuICBzdWNjZXNzQ2FsbGJhY2s/OiBJU3VjY2VzcztcclxuICBmYWlsQ2FsbGJhY2s/OiBJRmFpbDtcclxuICByZXNwb25zZUVsZW1lbnQ6IEhUTUxFbGVtZW50O1xyXG4gIC8vcmVmcmVzaFF1ZXVlOiBzdHJpbmdbXTtcclxuICBwcm9ncmVzc0h0bWwgPSAnIDxzcGFuIGNsYXNzPVwic3Bpbm5lci1ib3JkZXIgc3Bpbm5lci1ib3JkZXItc21cIj48L3NwYW4+JztcclxuICAvL3NlbGVjdG9yPzogc3RyaW5nO1xyXG4gIHByaXZhdGUgcHJlZml4ID0gJ2RhdGEtamF6b3ItJztcclxuXHJcbiAgLy8gcHJvY2VzcyBjbGljayBldmVudHMgYW5kIGNhbGwgdXJsIGZyb20gdGhpcyBhdHRyaWJ1dGUsIGZpcmVzIG9ubHkgb24gY2xpY2tcclxuICBwcml2YXRlIGNsaWNrQXR0cmlidXRlID0gdGhpcy5wcmVmaXggKyAnY2xpY2snO1xyXG5cclxuICAvLyBzaG93IGNvbmZpcm0gd2luZG93cywgaG9vayBpdCB0byBib290c3RyYXAgbW9kYWxcclxuICBwcml2YXRlIGNvbmZpcm1BdHRyaWJ1dGUgPSB0aGlzLnByZWZpeCArICdjb25maXJtJztcclxuXHJcbiAgLy8gc2Vjb25kcyBkZWxheSBBUEkgbG9hZCwgbWFrZXMgc2Vuc2Ugb25seSBmb3IgdXJsQXR0cmlidXRlXHJcbiAgcHJpdmF0ZSBkZWxheUF0dHJpYnV0ZSA9IHRoaXMucHJlZml4ICsgJ2RlbGF5JztcclxuXHJcbiAgLy8gbWV0aG9kIHVzZWQgZ2V0L3Bvc3RcclxuICBwcml2YXRlIG1ldGhvZEF0dHJpYnV0ZSA9IHRoaXMucHJlZml4ICsgJ21ldGhvZCc7XHJcblxyXG4gIC8vIHByZXZlbnREZWZhdWx0IGlzIGRlZmF1bHQgdW5sZXNzIGVuYWJsZWRcclxuICBwcml2YXRlIGVuYWJsZURlZmF1bHRBdHRyaWJ1dGUgPSB0aGlzLnByZWZpeCArICdlbmFibGUtZGVmYXVsdCc7XHJcblxyXG4gIC8vIGZsYWcgZWxlbWVudCBzbyB3ZSBrbm93IHRoYXQgY2xpY2sgbGlzdGVuZXIgd2FzIGFkZGVkXHJcbiAgcHJpdmF0ZSBwcm9jZXNzZWRGbGFnQXR0cmlidXRlID0gdGhpcy5wcmVmaXggKyAncHJvY2Vzc2VkJztcclxuXHJcbiAgLy8gcmVmcmVzaCB0aGlzIGNhbGwgaW4geCBzZWNvbmRzXHJcbiAgcHJpdmF0ZSByZWZyZXNoQXR0cmlidXRlID0gdGhpcy5wcmVmaXggKyAncmVmcmVzaCc7XHJcblxyXG4gIC8vIHJlZnJlc2ggZmxhZ1xyXG4gIHByaXZhdGUgcmVmcmVzaFJ1bm5pbmdBdHRyaWJ1dGUgPSB0aGlzLnByZWZpeCArICdyZWZyZXNoLXJ1bm5pbmcnO1xyXG5cclxuICAvLyBlbGVtZW50IHRvIHNob3cgc29tZSBsb2cgaW5mb3JtYXRpb25cclxuICBwcml2YXRlIHJlc3BvbnNlQXR0cmlidXRlID0gdGhpcy5wcmVmaXggKyAncmVzcG9uc2UnO1xyXG5cclxuICAvLyBlbGVtZW50IHRvIHJlbmRlciB1cmwgcmVzcG9uc2VcclxuICBwcml2YXRlIHRhcmdldEF0dHJpYnV0ZSA9IHRoaXMucHJlZml4ICsgJ3RhcmdldCc7XHJcblxyXG4gIC8vIHNhdmUgY2hlY2tib3ggY3VycmVudCB2YWx1ZSBhbmQgcmV1c2UgaWYgZmFpbFxyXG4gIHByaXZhdGUgdGVtcG9yYXJ5VmFsdWVBdHRyaWJ1dGUgPSB0aGlzLnByZWZpeCArICd0ZW1wJztcclxuXHJcbiAgLy8gbG9hZCBIdG1sIGZyb20gdGhpcyB1cmwsIGl0IHNob3VsZCBiZSB0cmlnZ2VyZWQgaW1tZWRpYXRlbHkgdW5sZXNzIGRlbGF5ZWRcclxuICBwcml2YXRlIHVybEF0dHJpYnV0ZSA9IHRoaXMucHJlZml4ICsgJ3VybCc7XHJcblxyXG4gIHByaXZhdGUgZGVmYXVsdENvbnRlbnRUeXBlID0gJ2FwcGxpY2F0aW9uL2pzb24nO1xyXG4gIC8vcHJpdmF0ZSBjb250ZW50VHlwZSA9IHVuZGVmaW5lZDtcclxuXHJcbiAgY29uc3RydWN0b3IoKSB7XHJcbiAgICB0aGlzLnJlc3BvbnNlRWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTEVsZW1lbnQ+KGBbJHt0aGlzLnJlc3BvbnNlQXR0cmlidXRlfV1gKVswXTtcclxuICAgIC8vdGhpcy5wcm9ncmVzc0h0bWwgPSBgICR7cHJvZ3Jlc3NIdG1sfWA7XHJcbiAgfVxyXG5cclxuICBpbml0KGV2ZW50TmFtZSA9ICdjbGljaycpIHtcclxuXHJcbiAgICBjb25zdCBjbGlja0VsZW1lbnRzVG9Qcm9jZXNzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbDxIVE1MRWxlbWVudD4oYFske3RoaXMuY2xpY2tBdHRyaWJ1dGV9XTpub3QoW3ZhbHVlPVwiXCJdKWApO1xyXG4gICAgY29uc3QgdXJsRWxlbWVudHNUb1Byb2Nlc3MgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxFbGVtZW50PihgWyR7dGhpcy51cmxBdHRyaWJ1dGV9XTpub3QoW3ZhbHVlPVwiXCJdKWApO1xyXG5cclxuICAgIGlmIChjbGlja0VsZW1lbnRzVG9Qcm9jZXNzLmxlbmd0aCA9PT0gMCAmJiB1cmxFbGVtZW50c1RvUHJvY2Vzcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgdGhpcy5sb2coYEF0dHJpYnV0ZXMgJHt0aGlzLmNsaWNrQXR0cmlidXRlfSBvciAke3RoaXMudXJsQXR0cmlidXRlfSBhcmUgbm90IHVzZWQgb3IgbWlzc2luZy5gKTtcclxuICAgIH1cclxuXHJcbiAgICB1cmxFbGVtZW50c1RvUHJvY2Vzcy5mb3JFYWNoKGFzeW5jIChlbGVtZW50KSA9PiB7XHJcblxyXG4gICAgICBjb25zdCBkZWxheSA9IHBhcnNlRmxvYXQoZWxlbWVudC5nZXRBdHRyaWJ1dGUodGhpcy5kZWxheUF0dHJpYnV0ZSkpO1xyXG5cclxuICAgICAgLy9pZiAoZWxlbWVudC5oYXNBdHRyaWJ1dGUodGhpcy5yZWZyZXNoQXR0cmlidXRlKSlcclxuICAgICAgLy8gICAgdGhpcy5yZWZyZXNoUXVldWUucHVzaChlbGVtZW50KTtcclxuXHJcbiAgICAgIGlmIChpc05hTihkZWxheSkpIHtcclxuICAgICAgICBhd2FpdCB0aGlzLmZldGNoQW5kUGFyc2UoZWxlbWVudCwgJ3RleHQvaHRtbCcpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgc2V0VGltZW91dChhc3luYyBmdW5jdGlvbiAoKSB7IGF3YWl0IHRoaXMuZmV0Y2hBbmRQYXJzZShlbGVtZW50LCAndGV4dC9odG1sJykgfS5iaW5kKHRoaXMpLCBkZWxheSAqIDEwMDApO1xyXG5cclxuICAgIH0pO1xyXG5cclxuICAgIGNsaWNrRWxlbWVudHNUb1Byb2Nlc3MuZm9yRWFjaCgoZWxlbWVudCkgPT4ge1xyXG5cclxuICAgICAgdGhpcy5hdHRhY2hlRXZlbnRzKGVsZW1lbnQsIGV2ZW50TmFtZSk7XHJcblxyXG4gICAgfSk7XHJcblxyXG5cclxuICAgIHRoaXMubW9uaXRvck5ld0NsaWNrcygpO1xyXG5cclxuICAgIC8vcHJvY2VzcyB0aGUgUXVldWVcclxuICAgIC8vdGhpcy5yZWZyZXNoUXVldWUuZm9yRWFjaCgoZWxlbWVudCkgPT4ge1xyXG5cclxuICAgIC8vfSk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGF0dGFjaGVFdmVudHMoZWxlbWVudDogSFRNTEVsZW1lbnQsIGV2ZW50TmFtZSA9ICdjbGljaycpIHtcclxuXHJcbiAgICAvLyBjbGljayB3YXMgYWxyZWFkeSBhdHRhY2hlZFxyXG4gICAgaWYgKGVsZW1lbnQuaGFzQXR0cmlidXRlKHRoaXMucHJvY2Vzc2VkRmxhZ0F0dHJpYnV0ZSkpIHJldHVybjtcclxuXHJcbiAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSh0aGlzLnByb2Nlc3NlZEZsYWdBdHRyaWJ1dGUsICcnKTtcclxuXHJcbiAgICBjb25zdCBpbnB1dEVsZW1lbnQgPSBlbGVtZW50IGFzIEhUTUxJbnB1dEVsZW1lbnQ7XHJcblxyXG4gICAgaWYgKGlucHV0RWxlbWVudC50eXBlID09PSAnY2hlY2tib3gnKSB7XHJcblxyXG4gICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSh0aGlzLnRlbXBvcmFyeVZhbHVlQXR0cmlidXRlLCBpbnB1dEVsZW1lbnQuY2hlY2tlZC50b1N0cmluZygpKTtcclxuXHJcbiAgICAgIC8vIHRoaXMgaXMgYWxzbyBmb3IgY2hhbmdlIGV2ZW50IGZvciBNYXRlcmlhbERlc2lnbiBvciBodHRwczovL2dpdGh1Yi5jb20vbWluaHVyL2Jvb3RzdHJhcC10b2dnbGVcclxuXHJcbiAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsICgpID0+IHtcclxuICAgICAgICBpZiAoaW5wdXRFbGVtZW50LmNoZWNrZWQudG9TdHJpbmcoKSAhPT0gZWxlbWVudC5nZXRBdHRyaWJ1dGUodGhpcy50ZW1wb3JhcnlWYWx1ZUF0dHJpYnV0ZSkpIHtcclxuXHJcbiAgICAgICAgICBpZiAodGhpcy5kZWJ1ZykgY29uc29sZS5sb2coJ1NlbmRpbmcgYSByZXF1ZXN0LCBzdGF0ZTogJyArIGlucHV0RWxlbWVudC5jaGVja2VkKTtcclxuXHJcbiAgICAgICAgICB0aGlzLnNlbmQoZWxlbWVudCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuXHJcbiAgICB9IGVsc2UgaWYgKGlucHV0RWxlbWVudC50eXBlID09PSAnc3VibWl0JyB8fCBlbGVtZW50LmdldEF0dHJpYnV0ZSh0aGlzLmNvbmZpcm1BdHRyaWJ1dGUpICE9PSBudWxsKSB7XHJcblxyXG4gICAgICBlbGVtZW50Lm9uY2xpY2sgPSAoZXZlbnQpID0+IHtcclxuXHJcbiAgICAgICAgdGhpcy5wcm9jZXNzQ2xpY2soZWxlbWVudCwgZXZlbnQpO1xyXG5cclxuICAgICAgICAvL2V2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG4gICAgICAgIC8vaWYgKGNvbmZpcm0oJ0RvIHlvdSB3YW50IHRvIHByb2NlZWQgd2l0aCB0aGlzIGFjdGlvbj8nKSkge1xyXG4gICAgICAgIC8vICB0aGlzLnNlbmQoZWxlbWVudCk7XHJcbiAgICAgICAgLy99XHJcbiAgICAgIH07XHJcbiAgICB9IGVsc2UgaWYgKGlucHV0RWxlbWVudC50eXBlID09PSAnYnV0dG9uJykge1xyXG5cclxuICAgICAgZWxlbWVudC5vbmNsaWNrID0gKGV2ZW50KSA9PiB7IHRoaXMucHJvY2Vzc0NsaWNrKGVsZW1lbnQsIGV2ZW50KTsgfTtcclxuXHJcbiAgICB9IGVsc2VcclxuICAgICAgZWxlbWVudC5vbmNsaWNrID0gKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgdGhpcy5wcm9jZXNzQ2xpY2soZWxlbWVudCwgZXZlbnQpO1xyXG4gICAgICAgIC8vaWYgKGVsZW1lbnQudGFnTmFtZSA9PT0gJ0EnKSBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIC8vdGhpcy5zZW5kKGVsZW1lbnQpO1xyXG4gICAgICB9O1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBwcm9jZXNzQ2xpY2soZWxlbWVudDogSFRNTEVsZW1lbnQsIGV2ZW50OiBNb3VzZUV2ZW50KSB7XHJcblxyXG4gICAgaWYgKCFlbGVtZW50Lmhhc0F0dHJpYnV0ZSh0aGlzLmVuYWJsZURlZmF1bHRBdHRyaWJ1dGUpKSBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuICAgIGlmIChlbGVtZW50LmdldEF0dHJpYnV0ZSh0aGlzLmNvbmZpcm1BdHRyaWJ1dGUpID09PSBudWxsKSB7XHJcblxyXG4gICAgICB0aGlzLnNlbmQoZWxlbWVudCk7IHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoY29uZmlybSgnRG8geW91IHdhbnQgdG8gcHJvY2VlZCB3aXRoIHRoaXMgYWN0aW9uPycpKSB0aGlzLnNlbmQoZWxlbWVudCk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIG1vbml0b3JOZXdDbGlja3MoKSB7XHJcblxyXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBhc3luYyAoZTogTW91c2VFdmVudCkgPT4ge1xyXG5cclxuICAgICAgY29uc3QgZWxlbWVudCA9IGUudGFyZ2V0IGFzIEhUTUxFbGVtZW50O1xyXG5cclxuICAgICAgaWYgKGVsZW1lbnQuaGFzQXR0cmlidXRlKHRoaXMucHJvY2Vzc2VkRmxhZ0F0dHJpYnV0ZSkpIHJldHVybjtcclxuXHJcbiAgICAgIGlmICghZWxlbWVudC5oYXNBdHRyaWJ1dGUodGhpcy51cmxBdHRyaWJ1dGUpICYmICFlbGVtZW50Lmhhc0F0dHJpYnV0ZSh0aGlzLmNsaWNrQXR0cmlidXRlKSkgcmV0dXJuO1xyXG5cclxuICAgICAgaWYgKGVsZW1lbnQuaGFzQXR0cmlidXRlKHRoaXMuY2xpY2tBdHRyaWJ1dGUpKSB7XHJcblxyXG4gICAgICAgIHRoaXMuYXR0YWNoZUV2ZW50cyhlbGVtZW50KTtcclxuXHJcbiAgICAgICAgdGhpcy5wcm9jZXNzQ2xpY2soZWxlbWVudCwgZSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vZWxlbWVudC5zZXRBdHRyaWJ1dGUodGhpcy5wcm9jZXNzZWRGbGFnQXR0cmlidXRlLCAnJyk7XHJcblxyXG4gICAgICAvL2lmIChlbGVtZW50LnRhZ05hbWUgPT09ICdBJykgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHJcbiAgICAgIC8vZWxlbWVudC5vbmNsaWNrID0gYXN5bmMgKGV2ZW50KSA9PiB7XHJcbiAgICAgIC8vICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAvLyAgcmV0dXJuIHRoaXMuZmV0Y2hBbmRQYXJzZShlbGVtZW50LCAndGV4dC9odG1sJyk7XHJcbiAgICAgIC8vICAvL3JldHVybiBmYWxzZTtcclxuICAgICAgLy99O1xyXG5cclxuICAgICAgaWYgKGVsZW1lbnQuaGFzQXR0cmlidXRlKHRoaXMudXJsQXR0cmlidXRlKSkgYXdhaXQgdGhpcy5mZXRjaEFuZFBhcnNlKGVsZW1lbnQsICd0ZXh0L2h0bWwnKTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBzZW5kKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBjb250ZW50VHlwZTogc3RyaW5nID0gdGhpcy5kZWZhdWx0Q29udGVudFR5cGUpIHtcclxuXHJcbiAgICBjb25zdCBkYXRhID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtYWpheC1pZCcpO1xyXG4gICAgY29uc3QgbWV0aG9kID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUodGhpcy5tZXRob2RBdHRyaWJ1dGUpIHx8ICdnZXQnO1xyXG5cclxuICAgIC8vaWYgKG1ldGhvZCA9PT0gJ3Bvc3QnICYmIGRhdGEgPT09IG51bGwpIHtcclxuICAgIC8vICB0aGlzLmxvZygnZGF0YS1hamF4LWlkIGlzIG1pc3NpbmcnKTtcclxuICAgIC8vICByZXR1cm47XHJcbiAgICAvL31cclxuXHJcbiAgICBpZiAoKGVsZW1lbnQgYXMgSFRNTElucHV0RWxlbWVudCkudHlwZSA9PT0gJ2J1dHRvbicpIHtcclxuXHJcbiAgICAgIChlbGVtZW50IGFzIEhUTUxJbnB1dEVsZW1lbnQpLmRpc2FibGVkID0gdHJ1ZTtcclxuICAgICAgaWYgKHRoaXMucHJvZ3Jlc3NIdG1sKSBlbGVtZW50LmlubmVySFRNTCArPSB0aGlzLnByb2dyZXNzSHRtbDtcclxuICAgIH1cclxuXHJcbiAgICBpZiAobWV0aG9kID09PSAnZ2V0JyB8fCBtZXRob2QgPT09ICdkZWxldGUnKSB7XHJcbiAgICAgIHRoaXMuYWpheFNlbmQobWV0aG9kLCBjb250ZW50VHlwZSwgZWxlbWVudCwgJycsIHRoaXMuc3VjY2VzcywgdGhpcy5mYWlsKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChkYXRhID09PSBudWxsKSByZXR1cm47XHJcblxyXG4gICAgaWYgKGRhdGEuc3RhcnRzV2l0aCgneycpICYmIGRhdGEuZW5kc1dpdGgoJ30nKSkge1xyXG4gICAgICB0aGlzLmFqYXhTZW5kKG1ldGhvZCwgY29udGVudFR5cGUsIGVsZW1lbnQsIGRhdGEsIHRoaXMuc3VjY2VzcywgdGhpcy5mYWlsKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIC8vdGhpcy5hamF4U2VuZChtZXRob2QsIGVsZW1lbnQsIEpTT04uc3RyaW5naWZ5KHsgaWQ6IGRhdGEgfSksIHRoaXMuc3VjY2VzcywgdGhpcy5mYWlsKTtcclxuXHJcbiAgICAvL2Vsc2VcclxuICAgIC8vICB0aGlzLmFqYXhTZW5kKG1ldGhvZCwgZWxlbWVudCwgJycsIHRoaXMuc3VjY2VzcywgdGhpcy5mYWlsKTtcclxuXHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGFzeW5jIGZldGNoQW5kUGFyc2UoZWxlbWVudDogSFRNTEVsZW1lbnQsIGNvbnRlbnRUeXBlOiBzdHJpbmcgPSB0aGlzLmRlZmF1bHRDb250ZW50VHlwZSkge1xyXG5cclxuICAgIGNvbnN0IHVybCA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKHRoaXMudXJsQXR0cmlidXRlKTtcclxuXHJcbiAgICBpZiAoIXVybCkge1xyXG4gICAgICB0aGlzLmxvZygnRmV0Y2ggdXJsIGlzIG1pc3NpbmcnKTsgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBhd2FpdCBmZXRjaCh1cmwsXHJcbiAgICAgIHtcclxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiBjb250ZW50VHlwZSB9XHJcbiAgICAgIH0pXHJcbiAgICAgIC50aGVuKHRoaXMuaGFuZGxlRXJyb3JzKVxyXG4gICAgICAvLy50aGVuKChyZXNwb25zZSkgPT4ge1xyXG4gICAgICAvLyAgICBpZiAoIXJlc3BvbnNlLm9rKSB0aHJvdyBFcnJvcihgU3RhdHVzOiAke3Jlc3BvbnNlLnN0YXR1c30sICR7cmVzcG9uc2Uuc3RhdHVzVGV4dH1gKTtcclxuICAgICAgLy8gICAgcmV0dXJuIHJlc3BvbnNlO1xyXG4gICAgICAvL30pXHJcbiAgICAgIC50aGVuKChyZXNwb25zZSkgPT4ge1xyXG5cclxuICAgICAgICBjb25zdCBjb250ZW50VHlwZSA9IHJlc3BvbnNlLmhlYWRlcnMuZ2V0KFwiY29udGVudC10eXBlXCIpO1xyXG5cclxuICAgICAgICBpZiAoY29udGVudFR5cGUgJiYgY29udGVudFR5cGUuaW5jbHVkZXMoXCJhcHBsaWNhdGlvbi9qc29uXCIpKSB7XHJcbiAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuanNvbigpLnRoZW4oKGpzb24pID0+IHsgdGhpcy5wcm9jZXNzSnNvblJlc3BvbnNlKGpzb24sIGVsZW1lbnQpOyB9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLnRleHQoKS50aGVuKChodG1sKSA9PiB7IHRoaXMucHJvY2Vzc0h0bWxSZXNwb25zZShodG1sLCBlbGVtZW50KTsgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KVxyXG4gICAgICAvLy50aGVuKChodG1sKSA9PiB7IHJldHVybiB7IGh0bWwsIGVsZW1lbnQgfSB9KTtcclxuICAgICAgLy8udGhlbigoaHRtbCkgPT4geyB0aGlzLnByb2Nlc3NIdG1sUmVzcG9uc2UoaHRtbCwgZWxlbWVudCk7IH0pXHJcbiAgICAgIC5jYXRjaChlcnJvciA9PiB7IHRoaXMubG9nRXJyb3IoZXJyb3IpOyB9KTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgaGFuZGxlRXJyb3JzKHJlc3BvbnNlKSB7XHJcblxyXG4gICAgaWYgKCFyZXNwb25zZS5vaykgdGhyb3cgRXJyb3IoYFN0YXR1czogJHtyZXNwb25zZS5zdGF0dXN9LCAke3Jlc3BvbnNlLnN0YXR1c1RleHR9YCk7XHJcblxyXG4gICAgcmV0dXJuIHJlc3BvbnNlO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBhamF4U2VuZChtZXRob2Q6IHN0cmluZywgY29udGVudFR5cGU6IHN0cmluZywgZWxlbWVudDogSFRNTEVsZW1lbnQsIGRhdGE6IHN0cmluZywgc3VjY2VzczogRnVuY3Rpb24sIGZhaWw6IEZ1bmN0aW9uKSB7XHJcblxyXG4gICAgY29uc3QgdXJsID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUodGhpcy5jbGlja0F0dHJpYnV0ZSk7XHJcblxyXG4gICAgaWYgKCF1cmwpIHtcclxuICAgICAgdGhpcy5sb2coJ0NsaWNrIHVybCBpcyBtaXNzaW5nJyk7IHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcclxuICAgIHhoci5vcGVuKG1ldGhvZCwgdXJsKTtcclxuICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKCdDb250ZW50LVR5cGUnLCBjb250ZW50VHlwZSB8fCB0aGlzLmRlZmF1bHRDb250ZW50VHlwZSk7XHJcbiAgICB4aHIub25sb2FkID0gKCkgPT4ge1xyXG4gICAgICBpZiAoeGhyLnN0YXR1cyA9PT0gMjAwKSB0aGlzLnN1Y2Nlc3MoeGhyLCBlbGVtZW50LCBjb250ZW50VHlwZSk7XHJcbiAgICAgIGVsc2UgdGhpcy5mYWlsKHhociwgZWxlbWVudCk7XHJcbiAgICB9XHJcblxyXG4gICAgeGhyLnNlbmQoZGF0YSk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGZhaWwoeGhyOiBYTUxIdHRwUmVxdWVzdCwgZWxlbWVudDogSFRNTEVsZW1lbnQpIHtcclxuXHJcbiAgICB0aGlzLmxvZ0Vycm9yKGBUaGVyZSB3YXMgYSBwcm9ibGVtIHdpdGggdGhpcyBhY3Rpb24uIFJldHVybmVkIHN0YXR1cyBvZiAke3hoci5zdGF0dXN9LCAke3hoci5yZXNwb25zZX1gKTtcclxuXHJcbiAgICBpZiAoKGVsZW1lbnQgYXMgSFRNTElucHV0RWxlbWVudCkudHlwZSA9PT0gJ2NoZWNrYm94Jykge1xyXG5cclxuICAgICAgLy8gcmV0dXJuIHByZXZpb3VzIHN0YXRlIGZyb20gZGF0YS1hamF4LXRlbXBcclxuICAgICAgKGVsZW1lbnQgYXMgSFRNTElucHV0RWxlbWVudCkuY2hlY2tlZCA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKHRoaXMudGVtcG9yYXJ5VmFsdWVBdHRyaWJ1dGUpID09PSAndHJ1ZSc7XHJcblxyXG4gICAgfSBlbHNlIGlmICgoZWxlbWVudCBhcyBIVE1MSW5wdXRFbGVtZW50KS50eXBlID09PSAnc3VibWl0JyB8fCAoZWxlbWVudCBhcyBIVE1MSW5wdXRFbGVtZW50KS50eXBlID09PSAnYnV0dG9uJykge1xyXG4gICAgICAoZWxlbWVudCBhcyBIVE1MSW5wdXRFbGVtZW50KS5kaXNhYmxlZCA9IGZhbHNlO1xyXG4gICAgICBlbGVtZW50LmlubmVySFRNTCA9IGVsZW1lbnQuaW5uZXJIVE1MLnJlcGxhY2UodGhpcy5wcm9ncmVzc0h0bWwsICcnKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy5mYWlsQ2FsbGJhY2sgIT09IHVuZGVmaW5lZCkgdGhpcy5mYWlsQ2FsbGJhY2soeGhyLCBlbGVtZW50KTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgc3VjY2Vzcyh4aHI6IFhNTEh0dHBSZXF1ZXN0LCBlbGVtZW50OiBIVE1MRWxlbWVudCwgY29udGVudFR5cGU6IHN0cmluZykge1xyXG5cclxuICAgIGNvbnN0IHJlc3BvbnNlQ29udGVudFR5cGUgPSB4aHIuZ2V0QWxsUmVzcG9uc2VIZWFkZXJzKCk7XHJcblxyXG4gICAgaWYgKHJlc3BvbnNlQ29udGVudFR5cGUuaW5jbHVkZXMoXCJhcHBsaWNhdGlvbi9qc29uXCIpKVxyXG4gICAgICB0aGlzLnByb2Nlc3NKc29uUmVzcG9uc2UoSlNPTi5wYXJzZSh4aHIucmVzcG9uc2UpLCBlbGVtZW50KTtcclxuICAgIGVsc2UgdGhpcy5wcm9jZXNzSHRtbFJlc3BvbnNlKHhoci5yZXNwb25zZSwgZWxlbWVudCk7XHJcblxyXG4gICAgLy9jb25zdCBqc29uUmVzcG9uc2UgPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZSk7XHJcbiAgICAvL2NvbnNvbGUubG9nKGpzb25SZXNwb25zZSk7XHJcbiAgICAvL3RoaXMucmVtb3ZlRWxlbWVudChlbGVtZW50KTtcclxuXHJcbiAgICBpZiAoKGVsZW1lbnQgYXMgSFRNTElucHV0RWxlbWVudCkudHlwZSA9PT0gJ2NoZWNrYm94Jykge1xyXG5cclxuICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUodGhpcy50ZW1wb3JhcnlWYWx1ZUF0dHJpYnV0ZSwgKGVsZW1lbnQgYXMgSFRNTElucHV0RWxlbWVudCkuY2hlY2tlZC50b1N0cmluZygpKTtcclxuXHJcbiAgICB9IGVsc2UgaWYgKChlbGVtZW50IGFzIEhUTUxJbnB1dEVsZW1lbnQpLnR5cGUgPT09ICdzdWJtaXQnKSB7IH1cclxuXHJcbiAgICBpZiAodGhpcy5zdWNjZXNzQ2FsbGJhY2sgIT09IHVuZGVmaW5lZCkgdGhpcy5zdWNjZXNzQ2FsbGJhY2soZWxlbWVudCk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHByb2Nlc3NKc29uUmVzcG9uc2UoYWN0aW9uczogSVJlc3BvbnNlQWN0aW9uW10sIGVsZW1lbnQ6IEhUTUxFbGVtZW50KSB7XHJcbiAgICBhY3Rpb25zLmZvckVhY2goYWN0aW9uID0+IHtcclxuICAgICAgaWYgKGFjdGlvbi50eXBlID09PSAnbG9nJykgdGhpcy5sb2coYWN0aW9uLmh0bWwpO1xyXG4gICAgICBlbHNlIGlmIChhY3Rpb24udHlwZSA9PT0gJ3JlbW92ZUVsZW1lbnQnKSB0aGlzLnJlbW92ZUVsZW1lbnQoZWxlbWVudCwgYWN0aW9uLnNlbGVjdG9yKTtcclxuICAgICAgZWxzZSBpZiAoYWN0aW9uLnR5cGUgPT09ICd1cGRhdGVFbGVtZW50JykgdGhpcy51cGRhdGVFbGVtZW50KGVsZW1lbnQsIGFjdGlvbik7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgcHJvY2Vzc0h0bWxSZXNwb25zZShyZXNwb25zZTogc3RyaW5nLCBlbGVtZW50OiBIVE1MRWxlbWVudCkge1xyXG5cclxuICAgIC8vY29uc3QgZGl2VGFnID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAvL2RpdlRhZy5pbm5lckhUTUwgPSByZXNwb25zZTtcclxuICAgIC8vZWxlbWVudC5hcHBlbmRDaGlsZChkb2N1bWVudC5pbXBvcnROb2RlKGRpdlRhZywgdHJ1ZSkpO1xyXG4gICAgLy9lbGVtZW50LmZpcnN0RWxlbWVudENoaWxkLnJlbW92ZSgpO1xyXG5cclxuICAgIGlmIChlbGVtZW50Lmhhc0F0dHJpYnV0ZSh0aGlzLnRhcmdldEF0dHJpYnV0ZSkpIHtcclxuICAgICAgY29uc3QgbmV3RWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGVsZW1lbnQuZ2V0QXR0cmlidXRlKHRoaXMudGFyZ2V0QXR0cmlidXRlKSk7XHJcblxyXG4gICAgICBpZiAobmV3RWxlbWVudCA9PT0gbnVsbCkgcmV0dXJuO1xyXG4gICAgICBjb25zdCB1cmwgPSBlbGVtZW50LmdldEF0dHJpYnV0ZSh0aGlzLnVybEF0dHJpYnV0ZSk7XHJcbiAgICAgIGVsZW1lbnQgPSBuZXdFbGVtZW50O1xyXG4gICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSh0aGlzLnVybEF0dHJpYnV0ZSwgdXJsKTtcclxuICAgIH1cclxuXHJcbiAgICBlbGVtZW50LmlubmVySFRNTCA9IHJlc3BvbnNlO1xyXG5cclxuICAgIGNvbnN0IHNjcmlwdHMgPSBlbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTEVsZW1lbnQ+KGBzY3JpcHRgKTtcclxuXHJcbiAgICBzY3JpcHRzLmZvckVhY2goKHNjcmlwdCkgPT4ge1xyXG4gICAgICAvLyBpZGVhbGx5IHdlIGRvbid0IHdhbnQgdG8gdXNlIGV2YWwgYnV0IGxldCdzIHRyeSBpdFxyXG4gICAgICAvL2V2YWwoc2NyaXB0LmlubmVyVGV4dCk7XHJcbiAgICAgIGNvbnN0IHNjcmlwdFRhZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xyXG4gICAgICBzY3JpcHRUYWcuaW5uZXJIVE1MID0gc2NyaXB0LnRleHRDb250ZW50O1xyXG4gICAgICBzY3JpcHQucmVtb3ZlKCk7XHJcbiAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoc2NyaXB0VGFnKTtcclxuICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKCd0cmFuc2l0aW9uLWVuZCcpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaWYgKHNjcmlwdHMubGVuZ3RoID09PSAwKVxyXG4gICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoJ3RyYW5zaXRpb24tZW5kJyk7XHJcblxyXG4gICAgLy8gcmVmcmVzaCBmZXRjaCBcclxuICAgIGlmIChlbGVtZW50Lmhhc0F0dHJpYnV0ZSh0aGlzLnJlZnJlc2hBdHRyaWJ1dGUpICYmICFlbGVtZW50Lmhhc0F0dHJpYnV0ZSh0aGlzLnJlZnJlc2hSdW5uaW5nQXR0cmlidXRlKSkge1xyXG5cclxuICAgICAgY29uc3QgcmVmcmVzaEluID0gK2VsZW1lbnQuZ2V0QXR0cmlidXRlKHRoaXMucmVmcmVzaEF0dHJpYnV0ZSk7XHJcblxyXG4gICAgICBpZiAoaXNOYU4oK3JlZnJlc2hJbikpIHJldHVybjtcclxuXHJcbiAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKHRoaXMucmVmcmVzaFJ1bm5pbmdBdHRyaWJ1dGUsICcnKTtcclxuXHJcbiAgICAgIHNldFRpbWVvdXQoYXN5bmMgZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZSh0aGlzLnJlZnJlc2hSdW5uaW5nQXR0cmlidXRlKTtcclxuXHJcbiAgICAgICAgYXdhaXQgdGhpcy5mZXRjaEFuZFBhcnNlKGVsZW1lbnQsICd0ZXh0L2h0bWwnKTtcclxuXHJcbiAgICAgIH0uYmluZCh0aGlzKSwgK3JlZnJlc2hJbiAqIDEwMDApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSByZW1vdmVFbGVtZW50KGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBzZWxlY3Rvcjogc3RyaW5nKSB7XHJcbiAgICBlbGVtZW50LmNsb3Nlc3Qoc2VsZWN0b3IpLnJlbW92ZSgpO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSB1cGRhdGVFbGVtZW50KGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBhY3Rpb246IElSZXNwb25zZUFjdGlvbikge1xyXG5cclxuICAgIGNvbnN0IHNlbGVjdGVkRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGFjdGlvbi5zZWxlY3RvcikgYXMgSFRNTElucHV0RWxlbWVudDtcclxuXHJcbiAgICBpZiAoc2VsZWN0ZWRFbGVtZW50LnR5cGUgPT09ICdjaGVja2JveCcpIHtcclxuICAgICAgc2VsZWN0ZWRFbGVtZW50LmNoZWNrZWQgPSBhY3Rpb24uaHRtbCA9PT0gJ3RydWUnO1xyXG4gICAgfVxyXG4gICAgZWxzZSBzZWxlY3RlZEVsZW1lbnQub3V0ZXJIVE1MID0gYWN0aW9uLmh0bWw7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGxvZ0Vycm9yID0gKHRleHQ6IHN0cmluZykgPT4ge1xyXG4gICAgaWYgKHRoaXMucmVzcG9uc2VFbGVtZW50ICE9PSB1bmRlZmluZWQpXHJcbiAgICAgIHRoaXMucmVzcG9uc2VFbGVtZW50LmlubmVySFRNTCA9IGA8cCBjbGFzcz1cInRleHQtZGFuZ2VyXCI+JHt0ZXh0fTwvcD5gICsgdGhpcy5yZXNwb25zZUVsZW1lbnQuaW5uZXJIVE1MO1xyXG4gICAgY29uc29sZS5sb2codGV4dCk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGxvZyA9ICh0ZXh0OiBzdHJpbmcpID0+IHtcclxuICAgIGlmICh0aGlzLnJlc3BvbnNlRWxlbWVudCAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICB0aGlzLnJlc3BvbnNlRWxlbWVudC5pbm5lckhUTUwgPSBgPHA+JHt0ZXh0fTwvcD5gICsgdGhpcy5yZXNwb25zZUVsZW1lbnQuaW5uZXJIVE1MO1xyXG4gICAgY29uc29sZS5sb2codGV4dCk7XHJcbiAgfVxyXG59XHJcblxyXG5pbnRlcmZhY2UgSVN1Y2Nlc3Mge1xyXG4gIChlbGVtZW50OiBIVE1MRWxlbWVudCk6IHZvaWQ7XHJcbn1cclxuXHJcbmludGVyZmFjZSBJRmFpbCB7XHJcbiAgKHhocjogWE1MSHR0cFJlcXVlc3QsIGVsZW1lbnQ6IEhUTUxFbGVtZW50KTogdm9pZDtcclxufVxyXG5cclxuaW50ZXJmYWNlIElSZXNwb25zZUFjdGlvbiB7XHJcbiAgdHlwZTogc3RyaW5nO1xyXG4gIHNlbGVjdG9yOiBzdHJpbmc7XHJcbiAgaHRtbDogc3RyaW5nO1xyXG59Il19