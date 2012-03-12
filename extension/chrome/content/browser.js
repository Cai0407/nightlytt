/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Nightly Tester Tools.
 *
 * The Initial Developer of the Original Code is
 *     Dave Townsend <dtownsend@oxymoronical.com>.
 *
 * Portions created by the Initial Developer are Copyright (C) 2007
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var nightlyApp = {

repository: ['mozilla-central','mozilla-aurora'],

storedTitle: document.documentElement.getAttribute("titlemodifier"),

LAST_SESSION_GROUP_NAME_IDENTIFIER: "nightlytt-last-session-group-name",
_lastSessionGroupName: "",

get defaultTitle() {
  var tabbrowser = document.getElementById("content");
  return tabbrowser.getWindowTitleForBrowser(tabbrowser.mCurrentBrowser);
},

get tabTitle() {
  var tabbrowser = document.getElementById("content");
  return tabbrowser.mCurrentBrowser.contentTitle;
},

get tabGroupTitle() {
  // TabView isn't implemented or initialized
  if (!TabView || !TabView._window)
    return nightlyApp._lastSessionGroupName;


  // We get the active group this way, instead of querying
  // GroupItems.getActiveGroupItem() because the tabSelect event
  // will not have happened by the time the browser tries to
  // update the title.
  let groupItem = null;
  let activeTab = window.gBrowser.selectedTab;
  let activeTabItem = activeTab._tabViewTabItem;

  if (activeTab.pinned) {
    // It's an app tab, so it won't have a .tabItem. However, its .parent
    // will already be set as the active group. 
    groupItem = TabView._window.GroupItems.getActiveGroupItem();
  } else if (activeTabItem) {
    groupItem = activeTabItem.parent;
  }

  // groupItem may still be null, if the active tab is an orphan.
  return groupItem ? groupItem.getTitle() : "";
},

init: function()
{
  var brandbundle = document.getElementById("bundle_brand");
  if (nightly.variables.name==null)
  {
    nightly.variables.name=brandbundle.getString("brandShortName");
  }
  nightly.variables.brandname=brandbundle.getString("brandFullName");
  nightly.variables.defaulttitle=nightlyApp.storedTitle;

  var tabbrowser = document.getElementById("content");
  nightlyApp.oldUpdateTitlebar = tabbrowser.updateTitlebar;

  tabbrowser.updateTitlebar = nightly.updateTitlebar;
  tabbrowser.addEventListener("DOMTitleChanged", nightly.updateTitlebar, false);
  
  // Listening to Bug 659591 (landed in FF7) - instead "domwindowclosed" (see Bug 655269), 
  // to store active group's name for showing at next startup
  window.addEventListener("SSWindowClosing", function NightlyTT_onWindowClosing() {
    window.removeEventListener("SSWindowClosing", NightlyTT_onWindowClosing, false);
    nightlyApp.saveActiveGroupName(window);
  }, false);
  
  // grab the last used group title
  // use TabView's property if we are before Bug 682996 (landed in FF10)
  nightlyApp._lastSessionGroupName = (TabView && TabView._lastSessionGroupName) 
    ? TabView._lastSessionGroupName
    : Cc["@mozilla.org/browser/sessionstore;1"]
        .getService(Ci.nsISessionStore)
        .getWindowValue(
          window,
          nightlyApp.LAST_SESSION_GROUP_NAME_IDENTIFIER
        );
},

openURL: function(url)
{
  gBrowser.selectedTab = gBrowser.addTab(url);
},

openNotification: function(id, message, label, accessKey, callback) {
  var action = {
    label: label,
    callback: callback,
    accessKey: accessKey
  };
  var options = {
    timeout: Date.now() + 10000
  };

  PopupNotifications.show(gBrowser.selectedBrowser, id,
    message, "urlbar", action, null, options);
},

// Function: saveActiveGroupName
// Saves the active group's name for the given window.
saveActiveGroupName: function NightlyTT_saveActiveGroupName(win) {
  let groupName = nightlyApp.tabGroupTitle;
  Cc["@mozilla.org/browser/sessionstore;1"]
    .getService(Ci.nsISessionStore)
    .setWindowValue(
      win, 
      nightlyApp.LAST_SESSION_GROUP_NAME_IDENTIFIER, 
      groupName
    );
},

setCustomTitle: function(title)
{
  document.getElementById("content").ownerDocument.title = title;
},

setStandardTitle: function()
{
  var tabbrowser = document.getElementById("content");
  nightlyApp.oldUpdateTitlebar.call(tabbrowser);
}

}
