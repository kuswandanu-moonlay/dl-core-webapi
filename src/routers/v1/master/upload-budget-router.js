var Router = require("restify-router").Router;
var db = require("../../../db");
var resultFormatter = require("../../../result-formatter");
var passport = require("../../../passports/jwt-passport");
var fs = require('fs');
var csv = require('fast-csv');
var BudgetManager = require('dl-module').managers.master.BudgetManager; 
const apiVersion = '1.0.0';

function getRouter() { 
var router = new Router();
router.post('/',(request, response, next) => {
    var dateFormat = "DD MMM YYYY";
    var locale = 'id-ID';
    var moment = require('moment');
    moment.locale(locale);

    db.get().then(db => {
        var dataCsv = [];
        var dataAll; 
        var manager = new BudgetManager(db, {
            username: 'router'
        });

        fs.createReadStream(request.files.fileUpload.path)
            .pipe(csv())
            .on('data', function (data) {
                dataCsv.push(data);
            })
            .on('end', function (data) {
                dataAll = dataCsv;
                if (dataAll[0][0] === "Kode" && dataAll[0][1] === "Nama") {
                    manager.insert(dataAll)
                        .then(doc => {
                            if (doc[0]["Error"] ===undefined) {
                                var result = resultFormatter.ok(apiVersion, 201, doc);
                                response.send(201, result);
                            }
                            else {
                                var options = {
                                    "Kode": "string", 
                                    "Nama": "string", 
                                    "Error": "string"
                                };
                                response.xls(`Error Log-Budget ${moment(new Date()).format(dateFormat)}.xlsx`, doc, options);

                            }
                        })
                        .catch(e => {
                            var error = resultFormatter.fail(apiVersion, 404, e);
                            response.send(404, error);
                        })
                } else {
                    var error = resultFormatter.fail(apiVersion, 404, "");
                    response.send(404, error);

                }
            });
    })
});
return router;
}

module.exports = getRouter;