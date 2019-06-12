---
layout: single
title: "Using pytest and creating a testing coverage report from it"
header:
  overlay_image: https://github.com/mamonu/mamonu.github.io/raw/master/assets/hypt/QA_Glitch.gif
  overlay_filter: 0.75
  teaser: https://github.com/mamonu/mamonu.github.io/raw/master/assets/hypt/QA_Glitch.gif
date:   30-05-2019 06:58:07 +0000
---

# Using pytest 
## ... and creating a testing coverage report from it  🐞

<p></p>

---
## testing with pytest 
<br /> 

Today I will try to show a practical demo of using pytest.

Furthermore I will show we can be also produce coverage information in the form of an html report from the the pytest testing suite.

Initially i will install the pytest package if its not installed together with the coverage pytest plugin by running on a bash shell

```bash
pip install pytest pytest-cov
```

Ok. now we have our coverage plugin for pytest installed so lets create a little boring demo.

i create a directory and create a python file inside it.There I create the function

If it receives input of no length (so something like '') then it returns something grumpily
otherwise if it receives input of length less than 3 it returns something else grumpily.
Finaly if the length its more than 3 then it does something else with the input.


The main code called rather unimaginatively covdemo.py :  

<p></p>

![calc app](https://raw.githubusercontent.com/mamonu/mamonu.github.io/master/assets/hypt/covdemo.png)

<p></p>


I also create a test file in the same directory called test_covdemo.py . Here is the test code in all its grace and beauty 

![calc app](https://raw.githubusercontent.com/mamonu/mamonu.github.io/master/assets/hypt/covdemotest.png)


When I create this test I import the file that I created before.
In order to get a clearer picture I print the internals of what I imported in order to see
that I picked the function that I want to test.

I do this by:

```
print(dir(covtest))
```

I get from this the following and from what I see my function 'howmanyletters' has been picked up by the import.Great!!!!

```
['__builtins__', '__cached__', '__doc__', '__file__', '__loader__', '__name__', '__package__', '__spec__', 'howmanyletters', 'pytest']
```

<p></p>

---

## Test discoverability
<p></p>

There is a reason why i called my test file and my test functions in this way. By calling a file test_* or *_test i ensure this file gets autocollected by pytest when I eventually run it. Furthermore by call 
calling my testing functions test_something or test_something_else inside my test_something.py file those tests get picked up. 
Pytest will only execute whatever function has test* or *test in it so that when running the tests the

```
print(dir(covtest))
``` 
statement will be ignored.


</p>

---

## Runnning the test/tests 

<br /> 

ok its time to run my tests. I save and exit from my programming environment and go to the terminal.
There I put the following on the bash prompt

```
pytest -v
``` 

(-v is for verbose by the way)

![calc app](https://raw.githubusercontent.com/mamonu/mamonu.github.io/master/assets/hypt/cov-pytest-v1.png)

Yay. pytest found my test_covtest.py file and also my test_no_letters function. It run the test ... the test passed
And I got a [PASSED] in glorious green color. Life is good :)



</p>
---

## Testing coverage

<br /> 
<p></p>

Test coverage measures the percentage covered area to test the feature/functionality. 
It includes information about which parts of a program are actually executed when running our test suite to 
determine whether all the corners of program has been covered/executed.

<p></p>

What Test Coverage does

* Finding area of a requirement not implemented by a set of test cases

* Helps to create additional test cases to increase coverage

* Identifying meaningless test cases that do not increase coverage


In order to run my test suite and also get coverage information I need to just provide the directory of where the code to
be tested in. In order to be able to do this easily I go to the directory where the code is and do the following:

```bash
CWD="$(pwd)"
``` 

I just put the current working directory into a bash variable.
I then run pytest like this

```bash
pytest -v --cov=$CWD --cov-report html
``` 

I get the same screen as before but also the notification that the coverage report has been produced as well.
Having a look at the HTML report I see this:

![calc app](https://raw.githubusercontent.com/mamonu/mamonu.github.io/master/assets/hypt/coveragereport1.png)

Hm. It says I have not covered lines 8/9/11 and that my coverage is 68% .

I add another test to cover the eventuality of character length more than 0 but less than 3.

![calc app](https://raw.githubusercontent.com/mamonu/mamonu.github.io/master/assets/hypt/covtest2.png)


running the same thing as above again

```bash
pytest -v --cov=$CWD --cov-report html
``` 

I get 

![calc app](https://raw.githubusercontent.com/mamonu/mamonu.github.io/master/assets/hypt/coveragereport2.png)



Hm... Close. 88% coverage and only one line untested. Line 11...

Writing another test case


![calc app](https://raw.githubusercontent.com/mamonu/mamonu.github.io/master/assets/hypt/covtest3.png)


I get

![calc app](https://raw.githubusercontent.com/mamonu/mamonu.github.io/master/assets/hypt/cov-pytest-v3-cov.png)


and by checking the HTML report

![calc app](https://raw.githubusercontent.com/mamonu/mamonu.github.io/master/assets/hypt/coveragereport3.png)


:thumbsup:

OK now I have full testing coverage!!

At this point I need to remind everyone again that what the report was doing was giving information about which parts of a program were actually executed when running the test suite, in order to determine which branches of conditional statements have been taken.

Coverage is a very good tool / metric. However like everything in life as far as quality is concerned we need 
to be sceptics.Cue Goodhart's law states that "When a measure becomes a target, it ceases to be a good measure." 

Its easy to maximise coverage and it could mean that the percentage of code tested is high but just because this % is high or 100% doesnt mean that our software is infallible. 


![calc app](https://raw.githubusercontent.com/mamonu/mamonu.github.io/master/assets/hypt/cov.sketch.png)

The only thing we know is that we measured what % of code has NOT been tested. For this coverage is a perfect metric.

Martin Fowler has a [great](https://martinfowler.com/bliki/TestCoverage.html) article about testing coverage and his concerns have a point and it is highly recommended that you read it.






[1] Martin Fowler " [Test Coverage](https://martinfowler.com/bliki/TestCoverage.html) "


























