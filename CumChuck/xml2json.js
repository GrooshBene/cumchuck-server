var mongresto = (function(){ return {

  load:function(){
    var path = __dirname + '/mongresto-modules/', m;
    require('fs').readdirSync(path).forEach(function(x){
      m = require(path + x);
      this[m.name] = m;
    },this);
  }

};})();

// Start up
function pub(options){
  var m = {};
  [
    "path", "express", "body-parser", "app-root-path", "compression"
  ].forEach(function(x){ m[x.replace(/\W/g,'')] = require(x); });
  mongresto.load();
  var app = m.express();
  app.use(m.compression());
  app.use(m.bodyparser.json());
  app.use(m.bodyparser.urlencoded({ extended: false }));
  mongresto.init(app,options,m);
  return app;
}

// The old init method (deprecated but supported for a while)
pub.init = function(app,options){
  return mongresto.init.apply(mongresto,[app,options]);
};

module.exports = pub;
