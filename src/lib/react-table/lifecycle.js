export default Base =>
  class extends Base {
    componentWillMount () {
      this.setStateWithData(this.getDataModel(this.getResolvedState()))
    }

    componentDidMount () {
      this.fireFetchData()
    }

    componentWillReceiveProps (nextProps, nextState) {
      const oldState = this.getResolvedState()
      const newState = this.getResolvedState(nextProps, nextState)

      // Do a deep compare of new and old `defaultOption` and
      // if they are different reset `option = defaultOption`
      const defaultableOptions = ['sorted', 'filtered', 'resized', 'expanded']
      defaultableOptions.forEach(x => {
        const defaultName = `default${x.charAt(0).toUpperCase() + x.slice(1)}`
        if (
          JSON.stringify(oldState[defaultName]) !==
          JSON.stringify(newState[defaultName])
        ) {
          newState[x] = newState[defaultName]
        }
      })

      // If they change these table options, we need to reset defaults
      // or else we could get into a state where the user has changed the UI
      // and then disabled the ability to change it back.
      // e.g. If `filterable` has changed, set `filtered = defaultFiltered`
      const resettableOptions = ['sortable', 'filterable', 'resizable']
      resettableOptions.forEach(x => {
        if (oldState[x] !== newState[x]) {
          const baseName = x.replace('able', '')
          const optionName = `${baseName}ed`
          const defaultName = `default${optionName.charAt(0).toUpperCase() +
            optionName.slice(1)}`
          newState[optionName] = newState[defaultName]
        }
      })

      this.isPropsUpdate = true;
        // console.log(oldState.data==newState.data);
      // console.log(this.checkDataEqual(newState.data, oldState.data))
      // Props that trigger a data update
      if (this.isChange(newState, oldState)) {
          this.setStateWithData(this.getDataModel(newState))
      }else{
          if (this.isSameTabUpdate(newState, oldState)){
            if (this.tblRowsRef){
               this.tblRowsRef.changeState(newState);
            }
          }
      }
    }

    isChange(newState, oldState){
      return oldState.data !== newState.data ||
          oldState.tabIndex != newState.tabIndex ||
          oldState.columns !== newState.columns ||
          oldState.pivotBy !== newState.pivotBy ||
          oldState.sorted !== newState.sorted ||
          oldState.filtered !== newState.filtered;
    }

    isSameTabUpdate(newState, oldState){
        if (newState.tabIndex!="-1" && newState.tabIndex==oldState.tabIndex && !this.checkDataEqual(newState, oldState)){
            return true;
        }
        return false;
    }

    shouldComponentUpdate(nextProps,nextState) {
      if (this.isPropsUpdate){
        this.isPropsUpdate = false;
        if (!this.isChange(nextProps, this.props) && this.isSameTabUpdate(nextProps, this.props)) return false;
      }
      return true;
    }
  }
