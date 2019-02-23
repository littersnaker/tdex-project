import Store from './core/store';
import storeTypes from './core/storetypes';

//全局要用到的store数据
const Stores = {
    storeMap:{},
    userStore: null,

    init() {
        this.initUserStore();
    },
    crateStore(data, name){
        var store = this.storeMap[name];
        if (!store){
            store = new Store(data, name);
        }
        return store;
    },
    initUserStore(){
        const store = this.crateStore({
            user: {},
            uInfo:{},
        }, storeTypes.GLOBAL_USER);

        this.registerStore(store);
        this.userStore = store;
    },
    registerStore(store){
        this.storeMap[store.name] = store;
    },
    unRegisterStore(store){
        delete this.storeMap[store.name];
    },
    get(name){
        return this.storeMap[name];
    },
    setStoreData(name, key, value){
        var store = this.storeMap[name];
        if (store){
            store.cursor().set(key, value);
        }
    },
    getUserStore(){
        return this.userStore;
    },
    setUserData(value){
        //{"Uid":143970,"UserName":"M:00008679689756248","Token":"51ed6747eed0b0d8cf42d0cce521565a","Activated":true,"AuthList":null},"MyTradeId":"bf28642d5f41e4ca57df6eef5f25e7e0","Token":"51ed6747eed0b0d8cf42d0cce521565a"}
        this.userStore.cursor().set('user', value);
    },
    getUserData(){
        var data = this.userStore.data();
        var user = data.get('user');
        return user;
    },
    getUserInfo(){
        var data = this.userStore.data();
        var user = data.get('uInfo');
        return user;
    },
    setUserInfo(value){
        this.userStore.cursor().set('uInfo', value);
    },
    updateUserWalletInfo (wallet){
        var data = this.userStore.data();
        var user = data.get('uInfo');
        user.WalletMap = wallet;
    },

    resetUserStore(){
        this.userStore.reset();
    }
};

export default Stores;