* * *

# Is there a correlation between the review scores of Nintendo DS RPG games and how far into the console’s lifecycle the games were released?

[![Go to the profile of mamonu](https://cdn-images-1.medium.com/fit/c/100/100/1*KFXiBfl9EXsOI8qRWCDsNA.jpeg)](https://medium.com/@mamonu?source=post_header_lockup)[mamonu](https://medium.com/@mamonu)<span class="followState js-followState" data-user-id="6adc98b7e190"><button class="button button--smallest u-noUserSelect button--withChrome u-baseColor--buttonNormal button--withHover button--unblock js-unblockButton u-marginLeft10 u-xs-hide" data-action="sign-up-prompt" data-sign-in-action="toggle-block-user" data-requires-token="true" data-redirect="https://medium.com/@mamonu/do-the-scores-of-rpg-games-and-how-late-they-are-released-in-a-consoles-life-cycle-have-a-linear-18d7ff49474c" data-action-source="post_header_lockup"><span class="button-label  button-defaultState">Blocked</span><span class="button-label button-hoverState">Unblock</span></button><button class="button button--primary button--smallest button--dark u-noUserSelect button--withChrome u-accentColor--buttonDark button--follow js-followButton u-marginLeft10 u-xs-hide" data-action="sign-up-prompt" data-sign-in-action="toggle-subscribe-user" data-requires-token="true" data-redirect="https://medium.com/_/subscribe/user/6adc98b7e190" data-action-source="post_header_lockup-6adc98b7e190-------------------------follow_byline"><span class="button-label  button-defaultState js-buttonLabel">Follow</span><span class="button-label button-activeState">Following</span></button></span><time datetime="2017-07-02T17:51:49.407Z">Jul 2, 2017</time><span class="middotDivider u-fontSize12"></span><span class="readingTime" title="4 min read"></span>

So I have been frequently traveling on trains lately and that means…loads of time to waste watching trees and cows and sheep … or to play some games perhaps on my [Nintendo DS](https://en.wikipedia.org/wiki/Nintendo_DS).

![](https://cdn-images-1.medium.com/max/1600/1*2HOzC7_zg9HnZEM8k578UQ.png)

So while I was trying to best my New Super Mario Bros high-score I thought : “Wait a minute!!! I am sure I could find a list of games in one of the website I frequent somewhere with release dates and scores…”

Perhaps I can test a hunch that I have (ok ok … a _hypothesis_) that there is a relationship between scores in reviews and how late to a console life-cycle an RPG game has been released. I wanted to test some pandas functionality too so I started coding a small script.

<pre name="0482" id="0482" class="graf graf--pre graf-after--p">import pandas as pd</pre>

One of my favorite sites for RPG games has been [RPGFan](http://www.rpgfan.com/reviews.html). I consider its reviews trustworthy and they cover all kinds of consoles and platforms.So I decided to scrape the [Nintendo DS section](http://www.rpgfan.com/reviews-ds.html) of the reviews. Decided to use the .read_html() method from pandas. By providing some help and with some experimentation I got the data I wanted by doing this:

<pre name="3409" id="3409" class="graf graf--pre graf-after--p">rpgtbl = pd.read_html("[http://www.rpgfan.com/reviews-ds.html](http://www.rpgfan.com/reviews-ds.html)",match="Game Title",header=0,encoding="latin1")[-1]
rpgtbl.head()</pre>

By providing a hint (match=”Game Title”) , by specifying that the first row is the header and by taking the last table **[-1]** from the list of tables I got from **.read_html** I had all the data necessary. Here are the first 5 rows that .head() is giving me:

![](https://cdn-images-1.medium.com/max/1600/1*7HH56RKceFiDqNwLZYZc1A.png)

Now this might look easy. Its because pandas .read_html() made it easy to be able to transform an HTML table to a dataframe. Believe me when I say that you want to have these kinds of helper functions when you can since parsing HTML tables is a boring thankless task.So thank you **pandas** developers!

Anyway… I still needed to make the data more suitable for analysis. What I wanted was the time difference from the day the DS console was released (21-Nov-2004) to the date the game was reviewed. Its pandas time again:

<pre name="f660" id="f660" class="graf graf--pre graf-after--p">rpgtbl['datetime'] = pd.to_datetime(rpgtbl['Date'])
rpgtbl['days_since_release'] = (rpgtbl['datetime']-pd.Timestamp('20041121')).dt.days.astype(float)</pre>

Firstly I convert the **Date** column I got from the site into the **datetime** type from Pandas. Then I create a variable called **days_since_release** which took a **timestamp** of the date of the release and found the difference between that and the review date available in **datetime**. Then I use the **dt.days** accessor in order to get the number of days out of that and then convert it into a float.

![](https://cdn-images-1.medium.com/max/1600/1*GFaa4Klw62md827yHeawcw.png)

OK. Now the dates are fine but I want to do something with the score since I had it as a string in percentage format. Also I want to clean up a bit, and drop all columns I don’t really need by defining the ones I want to keep and keep only those.Again pandas to the rescue:

<pre name="5c06" id="5c06" class="graf graf--pre graf-after--p">rpgtbl ['rpgfanscore'] = rpgtbl['Score'].astype(str).str[:-1].astype(float)</pre>

<pre name="84ae" id="84ae" class="graf graf--pre graf-after--pre">keep=["Game Title","datetime","rpgfanscore"]
rpgtbl=rpgtbl[keep]
rpgtbl.head()</pre>

![](https://cdn-images-1.medium.com/max/1600/1*hu4ixAKVjd3THjyewYSyaA.png)

So now I am ready for some plotting . I also want to check if these variables are correlated at all:

<pre name="e881" id="e881" class="graf graf--pre graf-after--p"> _#_ plot inline
%matplotlib inline
import matplotlib.pylab as plt</pre>

<pre name="b82f" id="b82f" class="graf graf--pre graf-after--pre">X=rpgtbl['days_since_release']
y=rpgtbl['rpgfanscore']</pre>

<pre name="be96" id="be96" class="graf graf--pre graf-after--pre">plt.scatter(X,y)</pre>

<pre name="e6a5" id="e6a5" class="graf graf--pre graf-after--pre">_# check for correlation_</pre>

<pre name="5192" id="5192" class="graf graf--pre graf-after--pre">import numpy as np

np.corrcoef(X,y)</pre>

Well while the scatter plot could perhaps allude that there could be a relationship between the two variables

![](https://cdn-images-1.medium.com/max/1600/1*jR1jFUVM1OBnuE8YSEdYIg.png)

… correlation between the two variables is close to zero!

<pre name="b8b7" id="b8b7" class="graf graf--pre graf-after--p">array([[ 1\.        ,  0.02188139],
       [ 0.02188139,  1\.        ]])</pre>

So… the answer to the title question is “No its not so easy ! There seems to be no correlation between the score of a DS RPG game and how far into the console’s lifecycle the game was released”.

However it was a good excuse for trying some stuff out … I wanted to try to use the pandas .read_html() method since it simplifies a lot webscraping once you get what you want after a bit of trial and error.So… not all is lost. A fine way to waste time on a train journey. 😊

Now while this holds for Nintendo DS RPG games , I wonder if that is the case for ALL the consoles… 😉

btw the code for this can can be found on a github gist [here](https://gist.github.com/mamonu/a3d2b4f6c0baec1c62299d1d98d5ea93)

TM
