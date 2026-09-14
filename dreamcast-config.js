// Build 142: isolated Dreamcast Flycast WASM configuration.
(()=>{
  const BUILD=142;
  window.PixelPlayerDreamcast={
    core:'flycast',
    dataPath:'https://cdn.emulatorjs.org/stable/data/',
    loader:'https://cdn.emulatorjs.org/stable/data/loader.js',
    // EmulatorJS resolves custom core overrides by the archive filename.
    paths:{'flycast-wasm.data':`dreamcast-core/flycast-wasm.data?v=${BUILD}`},
    options:{
      webgl2Enabled:'enabled',
      reicast_boot_to_bios:'disabled',
      reicast_hle_bios:'disabled',
      reicast_threaded_rendering:'disabled',
      reicast_synchronous_rendering:'disabled',
      reicast_internal_resolution:'640x480',
      reicast_mipmapping:'disabled',
      reicast_anisotropic_filtering:'1',
      reicast_texupscale:'disabled',
      reicast_enable_rttb:'disabled',
      reicast_enable_purupuru:'disabled',
      reicast_alpha_sorting:'per-strip (fast, least accurate)',
      reicast_delay_frame_swapping:'disabled',
      reicast_frame_skipping:'enabled',
      reicast_framerate:'normal'
    }
  };
})();
