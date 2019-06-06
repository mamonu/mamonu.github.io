---
layout: single
title: "Unit Testing using Property Based Tests"
header:
  overlay_image: https://github.com/mamonu/mamonu.github.io/raw/master/assets/hypt/cropped-bd1.jpg
  overlay_filter: 0.75
  teaser: https://github.com/mamonu/mamonu.github.io/raw/master/assets/hypt/cropped-bd1.jpg
date:   06-06-2019 06:58:07 +0000
---



Property based testing has become quite famous in the functional world. 

It was introduced by the QuickCheck framework in Haskell and it suggests another way to test . 

Its not a magic bullet but rather a complementary addition to traditional example-based testing that we usually do.
It targets all the scope covered by example-based testing: from unit tests to integration tests.

</br>

In example-based unit tests you
- write down some example inputs
- write down the expected results
- you run your code and check that they match!





In Property-based Testing (PBT):

you need to specify post-conditions that must hold no matter what 

- you describe the input
- you describe the properties of the output
- Have the computer try lots of random examples – check they don’t fail
- shrink inputs to the minimal set of things needed to happen to fail automatically 




In Python,  [Hypothesis](https://github.com/HypothesisWorks/hypothesis/tree/master/hypothesis-python) 
is a great property-testing library which allows you to write tests along with pytest (its a pytest plugin_
. 
We are going to make use of this library.
Lets try to test a simple calculator app in Python

Our calculator app in all its glory

![calc app](https://raw.githubusercontent.com/mamonu/mamonu.github.io/master/assets/hypt/calcs.png)


---


So lets create some test methods for the app:

![calc app_t](https://github.com/mamonu/mamonu.github.io/raw/master/assets/hypt/pytestsimple1.png)

We run the tests created 


```bash
pytest -v
```

![calc pytest](https://github.com/mamonu/mamonu.github.io/raw/master/assets/hypt/pytestresult.png)

Great! everything passes! we are great. We tested everything. We also we have 100% coverage! 

---

Ok lets try now using Property-Based-Testing with the hypothesis module

After some changes needed the testing code becomes:

![calc hyptest](https://github.com/mamonu/mamonu.github.io/raw/master/assets/hypt/pytesthyp.png)

We run again the tests created using 

```bash
pytest -v
```

![calchyptestresults](https://github.com/mamonu/mamonu.github.io/raw/master/assets/hypt/pytesthypresult1.png)


Looking a bit closely to pytest output we  see this:

![calchyptestresult2](https://github.com/mamonu/mamonu.github.io/raw/master/assets/hypt/pytesthypresult2.png)


What is this trickery? (well it just says that any number could be there including nan and in such case.. BOOM )




