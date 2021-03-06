---
layout: single
title: "Code auto formatting"
header:
  overlay_image: https://github.com/mamonu/mamonu.github.io/raw/master/assets/cmft/codefmt-bg.jpg
  overlay_filter: 0.75
  teaser: https://github.com/mamonu/mamonu.github.io/raw/master/assets/cmft/codefmt-bg.jpg
date:   24-06-2019 06:58:07 +0000
---


## Code formatting in Python

### Using Black , Flake8 and precommit hooks

<br /> 

I have been talking in previous blog posts about the need for a process that ensures that code that is tested. Today I will talk about the need to also have code that is ... readable. Because its not enough for the code just to compile! 

Robert Martin on his book 'Clean Code' mentions that:

> “the ratio of time spent reading versus writing is well over 10 to 1. 
> We are constantly reading old code as part of the effort to write new code. ... Therefore, making it easy to 
> read makes it easier to write.” 

There is very good guidance for writting Python code. It is called [PEP8](https://www.python.org/dev/peps/pep-0008/) and its 
*THE official* Style Guide for Python Code. The process of styling and checking code quality, is often referred as linting.

Linters analyze code to detect various categories of 'lint' or small micro-defects. Those categories can be broadly defined as the following:


- Code errors
- Code with potentially unintended results
- Dangerous code patterns
- Stylistic errors

Its very easy to make your IDE give linter warnings if you have violated one of the many style rules. One such linter is `flake8`.

Personally when I use VS Code editor to warn me , I get at least 10-20 such warnings on my first try on something :smiley: . 
Just having the warnings of course is half the work. Correcting the code so it doesnt give warnings is the other half.
And its kind of boring to be frank. Thankfully there are tools to help with that!

---


Here is where  [![Code style: black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/ambv/black) comes into the picture.

Black formats my code, makes it readable so I dont have to do it all myself.I just need to install it from a bash terminal

```bash
pip install black
```

There is a [black Playground](https://black.now.sh/?version=stable&state=_Td6WFoAAATm1rRGAgAhARYAAAB0L-Wj4ARIAmpdAD2IimZxl1N_WlkPinBFoXIfdFTaTVkGVeHShArYj9yPlDvwBA7LhGo8BvRQqDilPtgsfdKl-ha7EFp0Ma6lY_06IceKiVsJ3BpoICJM9wU1VJLD7l3qd5xTmo78LqThf9uibGWcWCD16LBOn0JK8rhhx_Gf2ClySDJtvm7zQJ1Z-Ipmv9D7I_zhjztfi2UTVsJp7917XToHBm2EoNZqyE8homtGskFIiif5EZthHQvvOj8S2gJx8_t_UpWp1ScpIsD_Xq83LX-B956I_EBIeNoGwZZPFC5zAIoMeiaC1jU-sdOHVucLJM_x-jkzMvK8Utdfvp9MMvKyTfb_BZoe0-FAc2ZVlXEpwYgJVAGdCXv3lQT4bpTXyBwDrDVrUeJEg5cXH4TUTNf-yo029ofjTcZgdwbwkBGElHbHHsQNOhuA4R9GbE2Xx6TfVmH9I4AsqU3ohV7t3GkBwkM8XInLiVOQZ4p5yjM-SW4u3I6_BUS8o2djSZaPvzZPDScXVk1OXu3w0wV7DfrgiK_dpzHntoOvqSHrNLg-Ea6zvV6G2nil3QBTBPl5PDtMwDKchtvwmlhnbvTOrh53X9EnSe8QtRKbMLO4pxx4bAJX-hVCXl5OHpCGZLowD7JdKj1-NctJy9DL99yr-X6yu7KwGCYG7t3fm-lt7Lg_HS9xbBrWDVKBKwM2F7hmR1_n9RFjznRBHD3OpHKlgiWjbWJI0Q6GhXazSt_NVH1KtFiY_UPzzuchkeq2AcjGvQd3-ZPkoFJkNU1Xx7q1i62bM0OKwmDiCfvkAawxnd7m-XNxYKWe-wOQsezLPJVoqGQVoAAAAMKfaCNgGGWKAAGGBckIAABcXArGscRn-wIAAAAABFla)
where you can copy and paste some Python and see how it would look formatted by black.Have a look!

<br /> 
### Code formatting: minimal-ish viable project to use black and flake8 
---

I want to create however a way to do it on my code automatically.And to setup if not the most minimal configuration, 
at least a simple one that I want to set and forget! As a simple example I have some code that has some 
style issues. One line has way too much code.Some others have weird spacing. Nothing is failing but its not very readable.BTW this is just some code using the great [ciw](https://github.com/CiwPython/Ciw) package.

![ciw app](https://github.com/mamonu/mamonu.github.io/raw/master/assets/cmft/ciw-preblack.png)

I want to use it once so I just point it to my directory where my code is

```bash
black [nameofmycodedir]/
```

The result looks much better 


![ciw after black](https://github.com/mamonu/mamonu.github.io/raw/master/assets/cmft/after-black.png)


However I want to automate this process as much as possible. 


In order to do this I will use the [pre-commit](https://github.com/pre-commit/pre-commit) framework for creating some [git hook](https://git-scm.com/docs/githooks) scripts.

The maintainers describe pre-commit git hook scripts as: 

> 'useful for identifying simple issues before submission to code review. Pre-commit hooks on every commit automatically find
> out issues in code such as missing semicolons, trailing whitespace, etc. By pointing these issues out before code review,
> a code reviewer can focus on the architecture of a change while not wasting time with trivial style nitpicks.'

And remember we are not only finding them but we are automatically changing them to code that follows good practices.
Even if someone doesnt develop code that is under a code review process , automatic code style enforcement is still 
useful for our 'future-self' :stuck_out_tongue_closed_eyes: . 

<br /> 

### pre-commit setup to use black formatter and flake8 linter

In order to automate this process I will need to do the following :

---

<br /> 
#### step 1: install pre-commit by entering the following on a bash terminal prompt:
<br /> 


```bash
pip install pre-commit
```

<br /> 
#### step 2: add the following code on a file named `.pre-commit-config.yaml` on the folder where my code is:
<br /> 

```yaml
repos:
-   repo: https://github.com/ambv/black
    rev: stable
    hooks:
    - id: black
      language_version: python3.7
-   repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v1.2.3
    hooks:
    - id: flake8
```

I am adding black as a hook and also an existing one for flake8.Note that I am declaring the version of Python I want black to
know it should be working on.


<br /> 
#### step 3: run on a bash terminal on folder where code is :
<br /> 

```bash
pre-commit install
```
This installs the hooks above to the .git/ directory

<br /> 
#### step 4 : add `pyproject.toml` on the code directory which has the following:
<br /> 

```toml
[tool.black]
line-length = 79
include = '\.pyi?$'
exclude = '''
/(
    \.git
  | \.tox
  | \.venv
  | _build
  | buck-out
  | build
  | dist
)/
'''
```

You can add anything you DONT want black to change on the exclude part.
Note that the max-line-length is set to 79.Black has something like 88 as default but I have changed it to 79 so
as to not have issues with flake8. 

<br /> 
#### step 5: add `.flake8` file on the code directory :
<br /> 

flake8 performs a final check for compliance to PEP8. Since the code has been through black there should not be any suprises.
If you want some of the rules ignored then you can find all PEP8 rules [here](https://www.python.org/dev/peps/#finished-peps-done-with-a-stable-interface)
Add the ones you dont want on the ignore line on the `.flake8` file below:

```flake8
[flake8]
ignore = E203, E266, E501, W503, F403, F401
max-line-length = 79
select = B,C,E,F,W,T4,B9
```


Note that the max-line-length is 79 on flake8 as per PEP8. If needed we can also add here a limit on cyclomatic complexity by adding something like `max-complexity = 20` to the `.flake8` file. 

<br /> 
#### small sidestep into code complexity
<br /> 

![needlesly complex](https://www.jta.org/wp-content/uploads/2012/05/url.gif)
:grin:


> Cyclomatic complexity is a software metric used to indicate the complexity of a program. It is a quantitative measure 
> of the number of linearly independent paths through a program's source code.

Some people put a limit on this complexity.Others claim that its as useful as LOC (Lines of Code) as a metric. I personaly do not use it, but if I did, I would probably be interested in the complexity per function instead of the complexity of the whole program file ... Python package `radon` can be used to calculate complexity per function so if you are interested in this just `pip install radon` and read the [documentation](https://radon.readthedocs.io/en/latest/intro.html).

You are the person deciding if its something you want for your project but anyway with `flake8` the functionality is offered should you want it to stop your commit if its too complex as a way to enforce refactoring.

<br /> 
#### step 6: now use git with our added pre-commit hooks  :
<br /> 

I assume there has been a 'git init' statement and some added code already. If not do that first!Then:

```bash
git add .
git commit -m "my first pre-commit hook commit"
```

The result should be something like below:
black fails and then changes your code

![hooks after black](https://github.com/mamonu/mamonu.github.io/raw/master/assets/cmft/commithook2.png)

lets try once more.


```bash
git add .
git commit -m "this time for sure! "
git push
```
If everything passes (and assuming you have setup your remote repo address), the commit is made. 
If not, perform necessary edits and then commit again.


Code for everything mentioned above is availiable [here](https://github.com/mamonu/qiwdemo)

If you try pre-commit hooks and dont like them just do a `git init` and delete the `.flake8`,`.toml`,`.yaml` files from your code directory! Also the way we set it up pre-commit hooks are per project so other projects will not have them if you dont
want them.


### References 

 [1] Robert C. Martin, [Clean Code: A Handbook of Agile Software Craftsmanship](https://www.goodreads.com/book/show/3735293-clean-code)
 
 [2] [pre-commit](https://pre-commit.com/) hooks documentation
 
 [3] [black](https://black.readthedocs.io/en/stable/) documentation
 
 [4] [flake8](http://flake8.pycqa.org/en/latest/index.html) documentation
 
 [5] [Ruby Goldberg style needlesly complex machines video clip!](https://www.youtube.com/watch?v=qybUFnY7Y8w)
 
 [6] [pre-commit hooks for R projects](https://github.com/lorenzwalthert/pre-commit-hooks)
 
 
 
