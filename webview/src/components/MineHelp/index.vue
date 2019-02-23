<template>
  <scroller>
    <div class="help">
      <h2>{{$t('help.title')}}</h2>
      <p>{{$t('help.desc')}}</p>
      <h4>{{$t('help.title1')}}</h4>
      <p>{{$t('help.desc1')}}</p>
      <h4>{{$t('help.title2')}}</h4>
      <p>{{$t('help.desc2')}}</p>
      <h4>{{$t('help.title3')}}</h4>
      <p>{{$t('help.desc3')}}</p>
      <h4>{{$t('help.title4')}}</h4>
      <p>{{$t('help.desc4')}}</p>
      <h4>{{$t('help.title5')}}</h4>
      <p>{{$t('help.desc5')}}</p>
    </div>
  </scroller>
</template>

<script>
export default {
  mounted() {
    document.body.style = 'background: #fff !important;'
  }
}
</script>

<style lang="less">
.help {
  padding: 20px;
  color: #202833;
  h2 {
    text-align: center;
    font-size: 20px;
    padding: 10px 0 20px;
  }
  p {
    text-indent: 2em;
    line-height: 26px;
    font-size: 14px;
  }
  h4 {
    font-size: 14px;
    padding: 15px 0;
  }
}
</style>

