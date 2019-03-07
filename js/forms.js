
/* Handle form submissions */

//Define the CRM API URL
//e.g. https://api.mybusiness.com
var API_URL = 'https://api.loyica.cloud';

/**
   * jQuery serializeObject
   * @copyright 2014, macek <paulmacek@gmail.com>
   * @link https://github.com/macek/jquery-serialize-object
   * @license BSD
   * @version 2.5.0
   */
!function (e, i) { if ("function" == typeof define && define.amd) define(["exports", "jquery"], function (e, r) { return i(e, r) }); else if ("undefined" != typeof exports) { var r = require("jquery"); i(exports, r) } else i(e, e.jQuery || e.Zepto || e.ender || e.$) }(this, function (e, i) { function r(e, r) { function n(e, i, r) { return e[i] = r, e } function a(e, i) { for (var r, a = e.match(t.key); void 0 !== (r = a.pop());)if (t.push.test(r)) { var u = s(e.replace(/\[\]$/, "")); i = n([], u, i) } else t.fixed.test(r) ? i = n([], r, i) : t.named.test(r) && (i = n({}, r, i)); return i } function s(e) { return void 0 === h[e] && (h[e] = 0), h[e]++ } function u(e) { switch (i('[name="' + e.name + '"]', r).attr("type")) { case "checkbox": return "on" === e.value ? !0 : e.value; default: return e.value } } function f(i) { if (!t.validate.test(i.name)) return this; var r = a(i.name, u(i)); return l = e.extend(!0, l, r), this } function d(i) { if (!e.isArray(i)) throw new Error("formSerializer.addPairs expects an Array"); for (var r = 0, t = i.length; t > r; r++)this.addPair(i[r]); return this } function o() { return l } function c() { return JSON.stringify(o()) } var l = {}, h = {}; this.addPair = f, this.addPairs = d, this.serialize = o, this.serializeJSON = c } var t = { validate: /^[a-z_][a-z0-9_]*(?:\[(?:\d*|[a-z0-9_]+)\])*$/i, key: /[a-z0-9_]+|(?=\[\])/gi, push: /^$/, fixed: /^\d+$/, named: /^[a-z0-9_]+$/i }; return r.patterns = t, r.serializeObject = function () { return new r(i, this).addPairs(this.serializeArray()).serialize() }, r.serializeJSON = function () { return new r(i, this).addPairs(this.serializeArray()).serializeJSON() }, "undefined" != typeof i.fn && (i.fn.serializeObject = r.serializeObject, i.fn.serializeJSON = r.serializeJSON), e.FormSerializer = r, r });

$('document').ready(function () {

    var successBoxStyle = {
      color: "#0fa916",
      background: "#bcf7bc",
      padding: "15px",
      "border-radius": "2px",
      border: "solid thin #68cc68",
    };  

    var setMessage = function (form, msg, containerClass) {
        if (form.find('.form-msg').length) {
            form.find('.form-msg').text(msg);
        } else {
            form.prepend('<div class="form-msg'+ (containerClass && (' ' + containerClass) || '') +'">' + msg + '</div>');
            form.css('color','#df0000');
            form.find('.form-msg').css('padding-bottom','20px');
        }
    };

    var requestsInProgess = {};

    $('form').on('submit', function (e) {
        e.preventDefault();
        //console.log('Submit form', this);
        var form = $(this);
        var formID = form.data('id');
        if (formID) {
            //console.log('Form ID ' + formID);
            if (requestsInProgess[formID]) {
                return;
            }
            requestsInProgess[formID] = true;
            var fData = form.serializeObject();

            if (fData.full_name) {
                var fullNameParts = fData.full_name.split(' ');
                fData.first_name = (fullNameParts[0] || '').trim();
                fData.last_name = (fullNameParts[1] || '').trim();
            }

            var postData = {
                form: formID,
                data: fData,
            };
            //console.log('Post data', postData);
            var req;
            
            if(form.attr('enctype') == "multipart/form-data" || form.find('[type="file"]').length){
              const formData = new FormData()
              form.find('[type="file"]').each(function(){
                var fName = $(this).attr('name');
                if(fName && this.files && this.files[0]){
                  formData.append(fName,this.files[0])
                }
              })
              formData.append('form',postData.form);

              Object.keys(postData.data).forEach(function(k){
                formData.append('data[' + k + ']', postData.data[k]);
              })
              //console.log('postData',postData)
              //console.log('formData',formData)
              req = $.ajax({
                url: API_URL + '/form/submit',
                type: 'POST',
                data: formData,
                processData: false,  // tell jQuery not to process the data
                contentType: false,  // tell jQuery not to set contentType
              });
            }else{
              req = $.post(API_URL + '/form/submit', postData);
            }

            req.done(function (response) {
                var errorMessage = 'There was a problem handling your request, please try again later.<br/>Email us a contact@loyica.com';
                //console.log('Done, response:', response);
                if (response != null && typeof response == 'object') {
                    if ("ok" == response.status) {
                        var parent = form.parent();
                        form.prev('.form-header').fadeOut();
                        form.fadeOut('slow', function () {
                            form.remove();
                            setTimeout(function () { 
                              parent.append('<div class="form-success">Thanks for your interest, we will be in contact with you as soon as possible!</div>') 
                              parent.find('.form-success').css(successBoxStyle);
                            }, 200);
                        });
                    } else if (response.errors) {
                        setMessage(form, Object.keys(response.errors).map(function (k) { return response.errors[k] }).join(', '), 'alert alert-warning')
                    } else {
                        setMessage(form, errorMessage, 'alert alert-warning');
                    }
                } else {
                    setMessage(form, errorMessage, 'alert alert-warning');
                }
            })

            req.fail(function (response) {
                //console.log('Fail, response:', response);
                setMessage(form, errorMessage, 'alert alert-warning');
            })

            req.always(function () {
                requestsInProgess[formID] = false;
            })
        } else {
            //console.log('No form present, doing nothing.');
        }
    });
});
