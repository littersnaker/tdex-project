const fs = require("fs-extra");
const path = require("path");

const Locale = {
    init(setting, supportsLang){
        this.setting = setting;

        const langPacket = {};
        supportsLang.forEach((lang)=>{
            var filePath = path.join(__dirname, './lang', `${lang}.json`);
            // console.log(filePath);
            if (fs.existsSync(filePath)) {
                langPacket[lang] = JSON.parse(fs.readFileSync(filePath, "utf8"));
            }
        });

        // console.log(langPacket);
        this.langPacket = langPacket;
    },
    get(key){
        var info = this.langPacket[this.setting.language];
        return info && info[key] ? info[key] : key;
    }
};

module.exports = Locale;