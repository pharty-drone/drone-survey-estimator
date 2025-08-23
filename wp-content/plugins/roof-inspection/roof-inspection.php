<?php
/**
 * Plugin Name: Roof Inspection Map
 * Description: Draw a roof polygon, compute area, show estimate. Shortcode: [roof_map]
 * Version: 0.1.0
 * Author: You
 * License: GPLv2 or later
 * Text Domain: roof-inspection
 */

if (!defined('ABSPATH')) exit;

define('ROOF_INSPECTION_VER', '0.1.0');

add_action('wp_enqueue_scripts', function () {
  // Settings from wp-admin options (see 6. Settings)
  $opts = get_option('roof_inspection_options', []);
  $mapbox_token = isset($opts['mapbox_token']) ? $opts['mapbox_token'] : '';

  // Styles
  wp_enqueue_style('mapbox-gl', 'https://api.mapbox.com/mapbox-gl-js/v3.14.0/mapbox-gl.css', [], null);
  wp_enqueue_style('mapbox-draw', 'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-draw/v1.5.0/mapbox-gl-draw.css', [], null);
  wp_enqueue_style('roof-css', plugins_url('assets/roof.css', __FILE__), [], ROOF_INSPECTION_VER);

  // Scripts
  wp_enqueue_script('mapbox-gl', 'https://api.mapbox.com/mapbox-gl-js/v3.14.0/mapbox-gl.js', [], null, true);
  wp_enqueue_script('turf', 'https://unpkg.com/@turf/turf@6/turf.min.js', [], null, true);
  wp_enqueue_script('mapbox-draw', 'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-draw/v1.5.0/mapbox-gl-draw.js', ['mapbox-gl'], null, true);

  wp_enqueue_script('roof-js', plugins_url('assets/roof.js', __FILE__), ['mapbox-gl','mapbox-draw','turf'], ROOF_INSPECTION_VER, true);

  wp_localize_script('roof-js', 'ROOF_INSPECTION', [
    'accessToken' => $mapbox_token,
    'i18n' => [
      'draw' => __('Draw', 'roof-inspection'),
      'clear' => __('Clear', 'roof-inspection'),
      'area' => __('Area', 'roof-inspection'),
      'estimate' => __('Est. cost', 'roof-inspection'),
      'sqm' => __('m²', 'roof-inspection'),
      'sqft' => __('ft²', 'roof-inspection'),
    ],
    // Placeholder pricing; override with settings later
    'pricing' => [
      'base' => isset($opts['base_fee']) ? floatval($opts['base_fee']) : 49.0,
      'per_m2' => isset($opts['per_m2']) ? floatval($opts['per_m2']) : 0.45,
      'currency' => isset($opts['currency']) ? $opts['currency'] : '£'
    ],
    'center' => [ -2.0, 53.6 ],
    'zoom' => 16
  ]);
});

// Shortcode [roof_map]
add_shortcode('roof_map', function ($atts, $content = null) {
  $id = 'roof-map-' . wp_generate_uuid4();
  ob_start(); ?>
    <div id="<?php echo esc_attr($id); ?>" class="roof-map" aria-label="<?php esc_attr_e('Roof inspection map', 'roof-inspection'); ?>"></div>
    <div class="roof-toolbar" role="toolbar" aria-label="<?php esc_attr_e('Drawing tools', 'roof-inspection'); ?>">
      <button type="button" class="btn roof-draw" aria-pressed="true"><?php esc_html_e('Draw', 'roof-inspection'); ?></button>
      <button type="button" class="btn alt roof-clear"><?php esc_html_e('Clear', 'roof-inspection'); ?></button>
    </div>
    <div class="roof-hud" role="status" aria-live="polite">
      <div><?php esc_html_e('Area', 'roof-inspection'); ?>: <span class="badge roof-m2">0</span> <?php esc_html_e('m²', 'roof-inspection'); ?></div>
      <div><?php esc_html_e('Area', 'roof-inspection'); ?>: <span class="badge roof-ft2">0</span> <?php esc_html_e('ft²', 'roof-inspection'); ?></div>
      <div><?php esc_html_e('Est. cost', 'roof-inspection'); ?>: <span class="badge roof-est">–</span></div>
    </div>
    <script>
      window.addEventListener('DOMContentLoaded', function(){
        if (window.RoofInspection && typeof RoofInspection.init === 'function') {
          RoofInspection.init('<?php echo esc_js($id); ?>');
        }
      });
    </script>
  <?php
  return ob_get_clean();
});

