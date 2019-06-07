---
layout: single
title: "Testing using Property Based Tests"
header:
  overlay_image: https://github.com/mamonu/mamonu.github.io/raw/master/assets/hypt/cropped-bd1.jpg
  overlay_filter: 0.75
  teaser: https://github.com/mamonu/mamonu.github.io/raw/master/assets/hypt/cropped-bd1.jpg
date:   06-06-2019 06:58:07 +0000
---

Quis custodiet ipsos custodes? pt1

 
 
"Quis custodiet ipsos custodes?" is a Latin phrase found in the work of the Roman poet Juvenal from his Satires (Satire VI, lines 347–348). It translates to "but who will guard the guardians??" ...


This is also the header for two posts related to testing that I want to discuss
The first one that you are reading now is about property based testing which is an interesting way of testing your code.

It was introduced by the [QuickCheck](https://github.com/nick8325/quickcheck) framework in Haskell and it suggests another way to test your code. 
Its not a magic bullet but rather a complementary addition to traditional example-based testing that we usually do.
It covers the scope covered by example-based testing: from unit tests to integration tests.

<br /> 

In example-based unit tests you:

- define some example inputs
- define the expected results
- you run your code and check that they match!


<br /> 
<br /> 

Usualy we use some edge cases that we think they will break the system/function under test.
But we have work to do and sometimes these cases are far from exhaustive.


<br /> 


Enter PBT to the rescue. In Property-based Testing (PBT) on the other hand:

- you describe the properties of the input
- you describe the properties of the output
- Have the computer try lots of random examples – check they don’t fail
- If they do: shrink inputs ,to the minimal set of things needed to happen to fail, automatically 

<br /> 


In Python,  [Hypothesis](https://github.com/HypothesisWorks/hypothesis/tree/master/hypothesis-python) 
is a great property-testing library which allows you to write tests along with pytest (its a pytest plugin). 

We are going to make use of this library bweow with a small example.

We are going to create some simple tests  that specify properties from very simple functional requirements (inputs are floats)
Then Hypothesis will generate tests to try to falsify the properties. 
It will then try to shrink the set of values that cause errors in order to determine the minimal failure case/cases

<br /> 

---

<br /> 

#### simple app

<br /> 

Ok enough talking ,lets try to test a simple calculator app in Python.Here is our calculator app in all its glory:

<br /> 

![calc app](https://raw.githubusercontent.com/mamonu/mamonu.github.io/master/assets/hypt/calcs.png)

<br /> 

---

<br /> 
#### simple tests


<br /> 


So lets create some test methods for the app using pytest:

![calc app_t](https://github.com/mamonu/mamonu.github.io/raw/master/assets/hypt/pytestsimple1.png)

We run the tests created 


```bash
pytest -v
```

This results in:

![calc pytest](https://github.com/mamonu/mamonu.github.io/raw/master/assets/hypt/pytestresult.png)

Great! everything passes! we are great. We tested everything. We also we have 100% coverage  


---

<br /> 

####  But is this the best we can do?

<br /> 

Ok lets try now using Property-Based-Testing with the hypothesis module

After some changes needed the testing code becomes:

<br /> 

![calc hyptest](https://github.com/mamonu/mamonu.github.io/raw/master/assets/hypt/pytesthyp.png)

We run again the tests created using 

```bash
pytest -v
```

![calchyptestresults](https://github.com/mamonu/mamonu.github.io/raw/master/assets/hypt/pytesthypresult1.png)


Looking a bit closely to pytest output we  see this:

![calchyptestresult2](https://github.com/mamonu/mamonu.github.io/raw/master/assets/hypt/pytesthypresult2.png)

<br /> 
<br /> 

What is this trickery? 

<br /> 
<br /> 

Well it just says: 
any float number could be there including nan and in such case.. BOOM 
So please kind person writing the code, go back to your function and add something to deal with nan's (not a number) cases

---

<br /> 
<br /> 

Property Based Testing has been implemented in many languages. 
Below are some example implementations other than the one used above in Python. When I find more I will add them here.


Clojure:
 * [ClojureCheck](https://bitbucket.org/kotarak/clojurecheck) -- requires clojure.test

Java:
 * [JavaQuickCheck](http://java.net/projects/quickcheck/pages/Home) -- requires JUnit or some other testing framework

.NET (C#, F#, VB)
 * [FsCheck](https://github.com/fscheck/FsCheck)

Ruby:
 * [Rantly](https://github.com/hayeah/rantly)

Scala:
 * [ScalaCheck](https://github.com/rickynils/scalacheck) 

Groovy:
 * [Gruesome](https://github.com/mcandre/gruesome) -- a quick and dirty implementation for Groovy

JavaScript:
 * [QC.js](https://bitbucket.org/darrint/qc.js/)






