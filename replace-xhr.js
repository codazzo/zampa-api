// adapted from http://stackoverflow.com/a/24561614
module.exports = function replaceXHR(argRegexString, argReplacement, varName, debug){
  var argRegex;

  if (argRegexString) {
    argRegex = new RegExp(argRegexString);
  }

  (function(window){
    console.log('monkey patching XHR');

    function prettyPrintArgs(args){
      var s = "";
      for(var i = 0; i < a.length; i++) {
        s += "\t\n[" + i + "] => " + a[i];
      }
      return s;
    }

    var _XMLHttpRequest = window.XMLHttpRequest;

    window.XMLHttpRequest = function() {
      this.xhr = new _XMLHttpRequest();
    }

    // proxy ALL methods/properties
    var methods = [
      "open",
      "abort",
      "setRequestHeader",
      "send",
      "addEventListener",
      "removeEventListener",
      "getResponseHeader",
      "getAllResponseHeaders",
      "dispatchEvent",
      "overrideMimeType"
    ];

    methods.forEach(function(method){
      window.XMLHttpRequest.prototype[method] = function() {
        var args = [].slice.call(arguments);

        if (debug) {
          console.log("ARGUMENTS", method, args);
        }

        if (method === "open") {
          var url = args[1];
          if (argRegex && argRegex.test(url)) {
            var newArg = url.replace(argRegex, argReplacement);
            args.splice(1, 1, newArg);
            console.log("NEW ARGUMENTS", method, args);
          }
          this._url = args[1];
        }

        return this.xhr[method].apply(this.xhr, args);
      }
    });

    // proxy change event handler
    Object.defineProperty(window.XMLHttpRequest.prototype, "onloadend", {
      get: function(){
        // this will probably never called
        return this.xhr.onloadend;
      },
      set: function(onloadend){
        var that = this.xhr;
        var realThis = this;
        that.onloadend = function(){
          // request is fully loaded
          if (that.readyState == 4) {
            if (debug) {
              console.log('GOT THE MATCH');
              // console.log("RESPONSE RECEIVED:", typeof that.responseText == "string" ? that.responseText : "none");
            }
            // there is a response and filter execution based on url
            if (that.responseText && argRegex.test(realThis._url)) {
              window[varName] = that.responseText;
            }
          }
          onloadend.apply(that, arguments);
        };
      }
    });

    var otherscalars = [
      "onabort",
      "onerror",
      "onload",
      "onloadstart",
      // "onloadend",
      "onreadystatechange", //added
      "onprogress",
      "readyState",
      "responseText",
      "responseType",
      "responseXML",
      "status",
      "statusText",
      "upload",
      "withCredentials",
      "DONE",
      "UNSENT",
      "HEADERS_RECEIVED",
      "LOADING",
      "OPENED"
    ];

    otherscalars.forEach(function(scalar){
      Object.defineProperty(window.XMLHttpRequest.prototype, scalar, {
        get: function(){
          return this.xhr[scalar];
        },
        set: function(obj){
          this.xhr[scalar] = obj;
        }
      });
    });

    console.log('monkey patched XHR');
  })(window);
}
