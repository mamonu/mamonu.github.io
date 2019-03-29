---
layout: single
title: "Is there a correllation between Nintendo DS RPG games and how far into the console’s lifecycle the games were released"
date:   17-03-2019 08:38:07 +0000
---


(an older post migrated from my Medium blog)

So I have been frequently traveling on trains lately and that means…loads of time to waste watching trees and cows and sheep … or to play some games perhaps on my [Nintendo DS](https://en.wikipedia.org/wiki/Nintendo_DS).

![](https://cdn-images-1.medium.com/max/1600/1*2HOzC7_zg9HnZEM8k578UQ.png)

So while I was trying to best my New Super Mario Bros high-score I thought : “Wait a minute!!! I am sure I could find a list of games in one of the website I frequent somewhere with release dates and scores…”

Perhaps I can test a hunch that I have (ok ok … a _hypothesis_) that there is a relationship between scores in reviews and how late to a console life-cycle an RPG game has been released. I wanted to test some pandas functionality too so I started coding a small script.

One of my favorite sites for RPG games has been [RPGFan](http://www.rpgfan.com/reviews.html). I consider its reviews trustworthy and they cover all kinds of consoles and platforms.So I decided to scrape the [Nintendo DS section](http://www.rpgfan.com/reviews-ds.html) of the reviews. Decided to use the .read_html() method from pandas. By providing some help and with some experimentation I got the data I wanted by doing this:
![](https://raw.githubusercontent.com/mamonu/mamonu.github.io/master/assets/NDS/src2img(0).png)

By providing a hint (match=”Game Title”) , by specifying that the first row is the header and by taking the last table **[-1]** from the list of tables I got from **.read_html** I had all the data necessary. Here are the first 5 rows that .head() is giving me:

![](https://cdn-images-1.medium.com/max/1600/1*7HH56RKceFiDqNwLZYZc1A.png)

Now this might look easy. Its because pandas .read_html() made it easy to be able to transform an HTML table to a dataframe. Believe me when I say that you want to have these kinds of helper functions when you can since parsing HTML tables is a boring thankless task.So thank you **pandas** developers!

Anyway… I still needed to make the data more suitable for analysis. What I wanted was the time difference from the day the DS console was released (21-Nov-2004) to the date the game was reviewed. Its pandas time again:

![](https://raw.githubusercontent.com/mamonu/mamonu.github.io/master/assets/NDS/src2img(1).png)

Firstly I convert the **Date** column I got from the site into the **datetime** type from Pandas. Then I create a variable called **days_since_release** which took a **timestamp** of the date of the release and found the difference between that and the review date available in **datetime**. Then I use the **dt.days** accessor in order to get the number of days out of that and then convert it into a float.

![](https://cdn-images-1.medium.com/max/1600/1*GFaa4Klw62md827yHeawcw.png)

OK. Now the dates are fine but I want to do something with the score since I had it as a string in percentage format. Also I want to clean up a bit, and drop all columns I don’t really need by defining the ones I want to keep and keep only those.Again pandas to the rescue

![](https://raw.githubusercontent.com/mamonu/mamonu.github.io/master/assets/NDS/src2img(2).png)


![](https://cdn-images-1.medium.com/max/1600/1*hu4ixAKVjd3THjyewYSyaA.png)

So now I am ready for some plotting . I also want to check if these variables are correlated at all:

![](https://raw.githubusercontent.com/mamonu/mamonu.github.io/master/assets/NDS/src2img(3).png)


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
