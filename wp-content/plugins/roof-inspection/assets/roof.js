(function(){
  function format(n){ return (Math.round(n*100)/100).toLocaleString(); }

  function init(containerId){
    const container = document.getElementById(containerId);
    if (!container) return;

    mapboxgl.accessToken = ROOF_INSPECTION.accessToken || '';
    const map = new mapboxgl.Map({
      container: containerId,
      style: 'mapbox://styles/mapbox/satellite-v9',
      center: ROOF_INSPECTION.center || [-2.0, 53.6],
      zoom: ROOF_INSPECTION.zoom || 16,
      pitch: 45,
      bearing: -17
    });

    map.addControl(new mapboxgl.NavigationControl({showZoom:true,showCompass:true}), 'top-right');

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: { polygon:true, trash:true },
      defaultMode: 'draw_polygon'
    });
    map.addControl(draw);

    const hud  = container.nextElementSibling.nextElementSibling; // toolbar then hud
    const elM2 = hud.querySelector('.roof-m2');
    const elFt2= hud.querySelector('.roof-ft2');
    const elEst= hud.querySelector('.roof-est');

    function update(){
      const data = draw.getAll();
      if (data.features.length){
        const areaM2 = turf.area(data);
        const areaFt2= areaM2 * 10.76391041671;
        elM2.textContent = format(areaM2);
        elFt2.textContent= format(areaFt2);
        const p = ROOF_INSPECTION.pricing || {base:49,per_m2:0.45,currency:'£'};
        const estimate = p.base + p.per_m2 * areaM2;
        elEst.textContent = p.currency + format(estimate);
      } else {
        elM2.textContent = '0'; elFt2.textContent = '0'; elEst.textContent = '–';
      }
    }

    map.on('draw.create', update);
    map.on('draw.update', update);
    map.on('draw.delete', update);

    // Buttons
    const toolbar = container.nextElementSibling;
    toolbar.querySelector('.roof-draw').addEventListener('click', ()=> draw.changeMode('draw_polygon'));
    toolbar.querySelector('.roof-clear').addEventListener('click', ()=>{
      draw.deleteAll(); update();
    });

    // Public destroy if needed
    container.RoofInspectionDestroy = () => { map.remove(); };
  }

  window.RoofInspection = { init };
})();

