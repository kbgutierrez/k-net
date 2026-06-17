/**
 *
 * @element id(only) of the element without the #
 * @coordinates array of coordinates
 * @event show map on this event
 */
function load_map(element, coordinates, event = 'load') {

  /**
   * reload maps on nav tab
   */
  $(document).on(event, function (e) {
    map.invalidateSize();
  });
  if (map != undefined) {
    map.invalidateSize();
  }
  var map = L.map(element).setView([51.505, -0.09], 18);
  L.tileLayer('https://a.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18
  }).addTo(map);
}