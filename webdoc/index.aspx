<%@ Page Language="C#" ClassName="Mono.Website.Index" %>
<%@ Import Namespace="System.Web" %>
<%@ Import Namespace="System.Collections.Specialized" %>
<%@ Assembly name="monodoc" %>

<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Monodoc</title>
    <link rel="stylesheet" type="text/css" href="css/main.css" media="all" />
	<link type="text/css" rel="stylesheet" href="css/sidebar.css"/>
	<link rel="stylesheet" type="text/css" href="css/bootstrap.css" />
	<link rel="stylesheet" type="text/css" href="css/bootstrap-responsive.css" />
  </head>
  <body>
	<div id="banner" class="navbar">
	  <div class="navbar-inner">
		<div class="container">
		  <a class="brand" style="color: #ddd;" href="/">
			Mono Documentation
		  </a>
		  <form class="navbar-search pull-right">
			<input type="text" id="fsearch" class="search-query" placeholder="Search">
		  </form>
		  <ul class="nav pull-right">
			<li>
			  <a href="#" onclick="document.getElementById ('content_frame').contentWindow.print ()">
				<i class="icon-print icon-white"></i>
			  </a>
			</li>
			<li>
			  <a id="pageLink" href="/">
				<i class="icon-bookmark icon-white"></i>
			  </a>
			</li>
		  </ul>
		</div>
	  </div>
	</div>
	</div>
	<div id="main_part" class="container-fluid">
	  <div class="row-fluid">
		<div class="span3">
		  <div id="contents" class="activeTab">
			<div id="contentList"></div>
		  </div>
		</div>
		<div class="span9">
		  <iframe id="content_frame" src=""></iframe>
		</div>
	  </div>
	</div>
	<ul id="fsearch_window" class="typeahead dropdown-menu"></ul>
	<div id="fsearch_companion" class="tooltip left"><div class="tooltip-arrow"></div><div class="tooltip-inner" style="max-width: none"></div></div>
	<script src="js/jquery.min.js"></script>
	<script src="js/search.js"></script>
	<script src="xtree/xmlextras.js"></script>
	<script src="ptree/tree.js"></script>
	<script type="text/javascript">
var tree = new PTree ();
tree.strSrcBase = 'monodoc.ashx?tree=';
tree.strActionBase = '?link=';
tree.strImagesBase = 'xtree/images/msdn2/';
tree.strImageExt = '.gif';
tree.onClickCallback = function (url) { change_page (url); };
tree.imgClassClosed = 'icon-plus-sign';
tree.imgClassOpened = 'icon-minus-sign';
tree.imgTagName = 'i';
var content = $('#contentList');
var root = tree.CreateItem (null, 'Documentation List', 'root:', '', true);
content.append (root);
<% = Global.CreateTreeBootFragment () %>

update_tree = function () {
	var tree_path = $('#content_frame').contents ().find ('meta[name=TreePath]');
	if (tree_path.length > 0) {
	    var path = tree_path.attr ('value');
		if (path != '')
			tree.ExpandFromPath (path);
	}
};

var update_iframe_height = function () {
	var iframe = this;
	var iframeWin = iframe.contentWindow || iframe.contentDocument.parentWindow;
    if (iframeWin.document.body) 
        $(this).height ((iframeWin.document.documentElement.scrollHeight || iframeWin.document.body.scrollHeight) + 60);
};

var add_native_browser_link = function () {
	var contentDiv = $('#content_frame').contents ().find ('div[class=Content]').first ();
	if (contentDiv.length > 0 && typeof contentDiv.attr ('id') === 'string') {
		var id = contentDiv.attr ('id').replace (':Summary', '');
		var h2 = contentDiv.children ('h2').first ();
		if (h2.prev ().attr ('class') != 'native-browser')
		h2.before ('<a class="btn btn-small" href="mdoc://' + encodeURIComponent (id) + '"><img src="img/native-browser-icon.png" /> Open in Native Browser</a>');
	}
};
add_native_browser_link ();

content_frame.load (update_tree);
content_frame.load (update_iframe_height);
content_frame.load (add_native_browser_link);
content_frame.attr ('src', '<% = Global.GetContentFrame(Request) %>');
	</script>
</body>
</html>
