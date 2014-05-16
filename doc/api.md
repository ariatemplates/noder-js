title: API Documentation
page: api
---
# noderJS API Docs - UNDER CONSTRUCTION

noderJS exposes different APIs that you can find listed and documented here in this page.

## promise



## context

## find requires

## js eval

## request

##### request (url, options);

Method to perform XHR calls

**Parameter Values:**
* ``url : String``
* ``options : Object``

```js
options : {
	headers : {}, // Object - Header of the request
	data : "My Request is...", // String - Body of the request
	sync : true, // Boolean - It specifies if the request is synchronous or not (default: false)
	method : "GET" // String - Type of request (default: GET)
}
```


**Return Value:** ``promise``
* Example:

```js
// How to use the return value:
request(url, options).then(function (responseText, xhrObject) {
	// success callback
}, function(error) {
	// error callback
});
```

## async call

## current context

## async require