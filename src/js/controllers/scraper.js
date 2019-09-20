import $ from 'jquery'

function formatNumber (string) {
  let x = string.replace(/ /, '') // 20 K -> 20K

  if (x.match(/^(\d+\.\dK|\d+\.\dM|\d+,\dK|\d+,\dM)$/) != null) {
    x = x.replace(/K/, '00') // 20,2K -> 20,200 | 20.2K -> 20.200
    x = x.replace(/M/, '00000') // 20,2M -> 20,200000 | 20.2M -> 20.200000
  } else {
    x = x.replace(/K/, '000') // 20K -> 20000
    x = x.replace(/M/, '000000') // 20M -> 20000000
  }

  x = x.replace(/[.,]/, '') // quita comas o puntos

  return Number(x)
}

// Listener to scrape the values in real time
chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener((request) => {
    if (request.sender === 'www' && request.instruction === 'scrap') {
      // Get username

      // var usernameProf = (document.querySelector("div[dir='ltr'] > span").textContent).substring(1)

      var followingPath = window.location.pathname + '/following'
      var followersPath = window.location.pathname + '/followers'

      var followingNum = formatNumber(document.querySelector(`a[href="${followingPath}"]`).getAttribute('title'))

      var followersNum = formatNumber(document.querySelector(`a[href="${followersPath}"]`).getAttribute('title'))

      // get # of tweets and likes

      var quantity = formatNumber(document.querySelectorAll("h2[role='heading']")[1].nextSibling.textContent.split(' ')[0]) // "10K Tweets"
      // Get joined Date
      var joinedDateString = document.querySelectorAll("div[data-testid='UserProfileHeader_Items'] > span")[1].textContent

      // Get Verified value
      const verifiedClass = document.querySelector("svg[aria-label='Verified account']") // works only in english
      let verifiedBool
      if (verifiedClass) {
        verifiedBool = true
      } else {
        verifiedBool = false
      }

      // Creating Objects for data transfer to popup

      // Create verified object
      var joinedDate = {
        name: 'joinedDate',
        value: joinedDateString
      }

      // Create verified object
      var verified = {
        name: 'verified',
        value: verifiedBool
      }

      // Create tweets object
      var tweets = {
        name: 'tweets',
        value: quantity
      }

      // Create following object
      var following = {
        name: 'following',
        value: followingNum
      }

      // Create followers object
      var followers = {
        name: 'followers',
        value: followersNum
      }

      /* // Create likes object
      var likes = {
        name: 'likes',
        value: getDataCount(spans[3])
      } */

      // Create data structure to send to main context
      const data = {
        joinedDate: joinedDate,
        verified: verified,
        tweets: tweets,
        following: following,
        followers: followers
        // likes: likes
      }
      let tweetContainers = document.querySelectorAll("div[data-testid='tweet']")
      tweetContainers = Array.from(tweetContainers)

      const tweetTexts = tweetContainers.map((tweetContainer, index) => {
        if (!(tweetContainer.children[1]).classList.contains('Credibility-Ranking')) {
          $(tweetContainer.children[1]).addClass('Credibility-Ranking')
          $(tweetContainer.children[1]).append("<div class='Credibility-Ranking'><p id=TweetNumber" + index + '>...</p></div>')
        }
        return tweetContainer.children[1].innerText
      })

      port.postMessage({
        data: data,
        tweetTexts: tweetTexts,
        tweetContainers: tweetContainers
      })
    } else if (request.sender === 'www' && request.instruction === 'update') {
      UpdateTweetCredibility(request.credList)
    }
  })
})

function UpdateTweetCredibility (credibilityList) {
  credibilityList.map((credibilityItem, index) => {
    if (credibilityItem !== '--') {
      const Green = Math.floor(parseInt(credibilityItem) * (2.55))
      const Red = 255 - Math.floor(parseInt(credibilityItem) * (2.55))
      let GreenHex = Green.toString(16)

      if (GreenHex.length < 2) {
        GreenHex = '0' + GreenHex
      }
      var RedHex = Red.toString(16)
      if (RedHex.length < 2) {
        RedHex = '0' + RedHex
      }
      const FinalColor = '#' + (RedHex.toString(16)) + (GreenHex.toString(16)) + '00'
      $('#TweetNumber' + index).text('WWW Credibility: ' + credibilityItem + '%')
      $('#TweetNumber' + index).css('color', FinalColor)
    } else {
      $('#TweetNumber' + index).text('WWW Credibility: --')
    }
  })
}
