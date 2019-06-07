---
layout: single
title: "Unit Testing using Property Based Tests"
header:
  overlay_image: https://github.com/mamonu/mamonu.github.io/raw/master/assets/hypt/cropped-bd1.jpg
  overlay_filter: 0.75
  teaser: https://github.com/mamonu/mamonu.github.io/raw/master/assets/hypt/cropped-bd1.jpg
date:   06-06-2019 06:58:07 +0000
---



Property based testing is an interesting way of testing your code.

` `  
` `  
It was introduced by the QuickCheck framework in Haskell and it suggests another way to test . 

Its not a magic bullet but rather a complementary addition to traditional example-based testing that we usually do.
It covers the scope covered by example-based testing: from unit tests to integration tests.


` `  
` `  

In example-based unit tests you:

- define some example inputs
- define the expected results
- you run your code and check that they match!


` `  
` `  
Usualy we use some edge cases that we think they will break the system/function under test.
But we have work to do and sometimes these cases are far from exhaustive.

` `  
` `  
Enter PBT to the rescue. In Property-based Testing (PBT) on the other hand:

- you describe the properties of the input
- you describe the properties of the output
- Have the computer try lots of random examples – check they don’t fail
- If they do: shrink inputs ,to the minimal set of things needed to happen to fail, automatically 


In Python,  [Hypothesis](https://github.com/HypothesisWorks/hypothesis/tree/master/hypothesis-python) 
is a great property-testing library which allows you to write tests along with pytest (its a pytest plugin). 

We are going to make use of this library bweow with a small example.

We are going to create some simple tests  that specify properties from very simple functional requirements (inputs are floats)
Then Hypothesis will generate tests to try to falsify the properties. 
It will then try to shrink the set of values that cause errors in order to determine the minimal failure case/cases

` `  
` `  

---
##### simple app

` `  
` `  

Ok enough talking ,lets try to test a simple calculator app in Python

Our calculator app in all its glory

![calc app](https://raw.githubusercontent.com/mamonu/mamonu.github.io/master/assets/hypt/calcs.png)


---
##### simple tests

` `  
` `  

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
##### But is this the best we can do?


` `  
` `  

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


What is this trickery? 


` `  
` `  

Well it just says: 
any float number could be there including nan and in such case.. BOOM 
So please kind person writing the code, go back to your function and add something to deal with nan's (not a number) cases




