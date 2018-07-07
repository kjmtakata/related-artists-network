var app = angular.module("RelatedArtistsApp", ['ngMaterial']);

app.controller('RelatedArtistsController', ['$scope', '$http', '$q', '$sce', function($scope, $http, $q, $sce) {

	$scope.searchText = "";
	$scope.selectedItem = null;
	$scope.nodes = {};
	$scope.edges = [];
	$scope.isSearching = false;
	$scope.accessToken = "test";
	$scope.depth = 4;
	$scope.breadth = 4;
	$scope.playerUrl = $sce.trustAsResourceUrl("");

	$scope.autocomplete = function() {
		return $http.get("/spotify/search", {
			params: {
				q: $scope.searchText+"*",
				type: "artist"
			}
		}).then(function(response) {
			var results = [];
			angular.forEach(response.data.artists.items, function(artist) {
				results.push({
					value: artist.id,
					display: artist.name,
					popularity: artist.popularity,
					image: getImage(artist.images)
				});
			});
			return results;
		});
	};

	$scope.doSearch = function() {
		$scope.isSearching = true;
		$scope.nodes = {};
		$scope.edges = [];
		$scope.curDepth = 0;

		$scope.nodes[$scope.selectedItem.value] = {
	    	id: $scope.selectedItem.value,
	    	label: $scope.selectedItem.display,
	    	value: $scope.selectedItem.popularity,
	    	// color: '#ff0000'
	    	image: $scope.selectedItem.image,
	    	borderWidth: 10
	    	// mass: $scope.selectedItem.popularity/100*10
	    };

	    var promise = $q.when();

		for(var i = 0; i < $scope.depth; i++) {
			promise = promise.then(generateLevel.bind(null, i));
		}

		promise.then(function() {
			console.log($scope.nodes);

			var nodesArray = [];
			angular.forEach($scope.nodes, function(node) {
				nodesArray.push(node);
			});
			console.log(nodesArray);

			var visNodes = new vis.DataSet(nodesArray);
			var visEdges = new vis.DataSet($scope.edges);

		    // create a network
		    var container = document.getElementById('mynetwork');

		    // provide the data in the vis format
		    var visData = {
		        nodes: visNodes,
		        edges: visEdges,
		    };
		    var options = {
		    	nodes: {
		    		scaling: {
						min: 0,
						max: 100,
						label: {
							enabled: true
						}
					},
					shape: "circularImage",
					mass: 4,
					color: {
						background: '#666666'
					}
		    	},
		    	edges: {
		    		smooth: {
		    			type: "continuous"
		    		}
		    	},
		    	layout: {
		    		// improvedLayout: false
		    	},

		    	physics: {
		    		enabled: true,
		    		solver: "barnesHut",
		    		barnesHut: {
      					"gravitationalConstant": -15000
    				},
		    	}
		    };

		    // initialize your network!
		    var network = new vis.Network(container, visData, options);
		    network.on("click", function(params) {
		    	console.log(params);
		    	if(params.nodes.length == 1) {
		    		$http.get("/spotify/artists/"+params.nodes[0]+"/top-tracks", {
						params: {
							country: "US"
						}
					}).then(function(response) {
						console.log(response);
						var url = "https://open.spotify.com/embed?theme=black&uri=" 
									+ response.data.tracks[0].uri;
						$scope.playerUrl = $sce.trustAsResourceUrl(url);
					});
		    	}
		    });
		    network.on("doubleClick", function(params) {
		    	console.log(params);
		    	if(params.nodes.length == 1) {
		    		// window.open("https://open.spotify.com/artist/"+params.nodes[0], '_blank');
		    		var artist = $scope.nodes[params.nodes[0]];
		    		$scope.selectedItem = {
						value: artist.id,
						display: artist.label,
						popularity: artist.value,
						image: artist.image
					};
					$scope.doSearch();
		    	}
		    });

		    $http.get("/spotify/artists/"+$scope.selectedItem.value+"/top-tracks", {
				params: {
					country: "US"
				}
			}).then(function(response) {
				console.log(response);
				var url = "https://open.spotify.com/embed?theme=black&uri=" 
							+ response.data.tracks[0].uri;
				$scope.playerUrl = $sce.trustAsResourceUrl(url);
			});
		    // network.on("startStabilizing", function() {
		    	$scope.isSearching = false;
		    // });
		    
		});
	};

	var generateLevel = function(curDepth) {
		var promises = [];
		angular.forEach($scope.nodes, function(node) {
			if(!node.done) {
				promises.push(generateRelatedArtists(node, curDepth));
			}
		});
		return $q.all(promises);
	};

	var generateRelatedArtists = function(sourceNode, curDepth) {
		sourceNode.done = true;
		console.log(sourceNode);
		return $http.get("/spotify/artists/"+sourceNode.id+"/related-artists", {
			params: {
				id: sourceNode.id
			}
		}).then(function(response) {
			console.log(response);

			var artist;
			for(var i = 0; i < $scope.breadth && i < response.data.artists.length; i++) {
				artist = response.data.artists[i];
				if(!$scope.nodes[artist.id]) {
					var gradient = (Math.min(Math.round(parseInt('00', 16) 
						+ curDepth*(256/($scope.depth-1))), 255)).toString(16).padStart(2, "0");
					var color = "#" + gradient + gradient + "ff";
					console.log(color);
					$scope.nodes[artist.id] = {
						id: artist.id,
						label: artist.name,
						value: artist.popularity,
						// shape: 'circularImage',
						// color: color,
						image: getImage(artist.images)
						// mass: artist.popularity/100*10
					};
					
				}
				$scope.edges.push({
					from: sourceNode.id,
					to: artist.id,
					width: $scope.breadth-i,
					// length: 1000*(i+1)
				});
			}

		});
	};

	var getImage = function(images) {
		if(images.length > 0) {
			return images[images.length-1].url;
		} else {
			return "http://68.media.tumblr.com/9824eaa04932ea704b6a8c05508c0bf6/tumblr_inline_mr4a5oxygp1qz4rgp.gif";
		}
	}

	var authGet = function(url, params, successCallback) {
		return $http.get(url, {
			params: params,
			headers: {
				Authorization: "Bearer " + $scope.accessToken
			}
		}).then(successCallback, function(response) {
			console.log("error", response);
			init().then(function() {
				authGet(url, params, successCallback);
			});
		});
	};

	var init = function() {
		return $http.get("token", {}).then(function(response) {
			console.log(response);
			$scope.accessToken = response.data.access_token;
		});
	};

	// init();

}]);
