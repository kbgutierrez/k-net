<?php (defined('BASEPATH')) OR exit('No direct script access allowed');

/* load the MX_Router class */
require APPPATH."third_party/MX/Router.php";

class MY_Router extends MX_Router
{
	/**
	 * Allow prefixed module URLs like <prefix>/<module> to be resolved
	 * by the target module's own config/routes.php.
	 */
	public function locate($segments)
	{
		$uri = implode('/', $segments);

		if (isset($segments[1])) {
			$prefixedRoutes = Modules::parse_routes($segments[1], $uri);
			if ($prefixedRoutes) {
				$segments = $prefixedRoutes;
			}
		}

		return parent::locate($segments);
	}
}