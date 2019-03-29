---
layout: single
title: "Getting Started with Docker"
date:   17-07-2017-07 08:38:07 +0000
header:
  overlay_image: /assets/docker.png
  overlay_filter: 0.75
  teaser: /assets/docker.png
---


This post is a quick "hello world" for Docker, showing basic steps needed to:

- Create a Docker image based on Ubuntu containing a sample "hello world" file. 
- Create a volume
- Spin up two new containers, each attached to the shared volume.
- Confirm that changes in the shared volume from one container are reflected in the other container
- Shut the containers down
- Restart the containers and confirm the changes are preserved
- Remove the containers
- Remove the images
- Remove the volume


1. Start by creating a working directory  
```bash
> mkdir docker-ubuntu
> cd docker-ubuntu
```
2. Create a new dockerfile
```bash
# Create an ubuntu image with a copy of the file "hello.txt"
FROM ubuntu
LABEL maintainer jknight
# Note the tailing slash is important, otherwise it'll copy "hello.txt" to the file "data"!
COPY hello.txt /data/ 
CMD ["bash"]
```
3. Create a random hello.txt file  
```bash
echo hi > hello.txt
```
4. Build the image  
```bash
> docker build -f dockerfile -t ubuntu-image .
```
5. Check the image: "docker image" or "docker image ls":
```bash
 > docker images 
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
ubuntu-image        latest              7c9fbfe76cc2        13 seconds ago      88.1MB
ubuntu              latest              47b19964fb50        5 days ago          88.1MB
```
Note this will show 2 images: the base image (ubuntu) and the one you just created (ubuntu-image). You can check image details with `docker inspect [imagename]`
6. Create a fresh volume  
```bash
> docker volume create myVolume
```
7. Check the volume was created   
```bash
 > docker volume ls
DRIVER              VOLUME NAME
local               myVolume
```
8. Use the image to create two new containers, attaching them both to the same volume   
```bash
> docker run -dit --name ubuntu1 --mount source=myVolume,target=/data my-ubuntu
> docker run -dit --name ubuntu2 --mount source=myVolume,target=/data my-ubuntu
```
9. Check the containers were created  
```bash
 > docker container ls
CONTAINER ID        IMAGE               COMMAND             CREATED             STATUS              PORTS               NAMES
d147370cf844        ubuntu              "/bin/bash"         8 seconds ago       Up 7 seconds                            ubuntu2
428e34a4bfdd        ubuntu              "/bin/bash"         12 seconds ago      Up 11 seconds                           ubuntu1
```
9. Check the running instances. 
10. ```bash
 > docker ps
CONTAINER ID        IMAGE               COMMAND             CREATED             STATUS              PORTS               NAMES
fd4a048a3000        ubuntu              "/bin/bash"         2 seconds ago       Up 2 seconds                            ubuntu2
f033f9d4be2c        ubuntu              "/bin/bash"         8 minutes ago       Up 8 minutes                            ubuntu1
```
11. Use "docker exec" to check confirm that containers contain the file we copied in   
```bash
 > docker exec ubuntu1 ls /data/hello.txt
-rw-r--r-- 1 root root 4.1K Feb  8 17:47 hello.txt
```
12. Confirm that the containers are using the shared volume:
Create a file in container 1 in the shared volume ...  
```bash
> docker exec ubuntu1 touch "test" /data/test.txt
```
... and confirm that container 2 see it as well ...
```bash
> docker exec ubuntu2 ls -alh /data/
total 16K
drwxr-xr-x 2 root root 4.0K Feb 11 14:24 .
drwxr-xr-x 1 root root 4.0K Feb 11 14:22 ..
-rw-r--r-- 1 root root 4.1K Feb  8 17:47 hello.txt
-rw-r--r-- 1 root root    0 Feb 11 14:24 test.txt
```
13. Stop both images   
```bash
> docker stop ubuntu1 ubuntu2
```
14. Restart both images & confirm that the test file is still there   
```bash
 > docker start ubuntu1 ubuntu2
ubuntu1
ubuntu2
 > docker exec ubuntu2 ls -alh /data/
total 16K
drwxr-xr-x 2 root root 4.0K Feb 11 14:24 .
drwxr-xr-x 1 root root 4.0K Feb 11 14:22 ..
-rw-r--r-- 1 root root 4.1K Feb  8 17:47 hello.txt
-rw-r--r-- 1 root root    0 Feb 11 14:24 test.txt
```
15. Force kill the containers and confirm they're gone but the images are still there   
```bash
 > docker rm --force ubuntu1 ubuntu2 
ubuntu1
ubuntu2
 > docker ps -a
CONTAINER ID        IMAGE               COMMAND             CREATED             STATUS              PORTS               NAMES
 > docker images
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
my-ubuntu           latest              b1854aaddabc        10 minutes ago      88.1MB
ubuntu              latest              47b19964fb50        5 days ago          88.1MB
```
16. Remove the images. Note the order is important, or else use --force   
```bash
> docker rmi my-ubuntu ubuntu
Untagged: my-ubuntu:latest
Deleted: sha256:b1854aaddabcd6f6ae2347299170370c122b11639c249d9f894888863235d486
Deleted: sha256:7852b756dc4317121215bcd31e5eeb08202b1e22a96f48bd14f617e77980652b
Deleted: sha256:0c446b469cb6760c2d01f7f1ffa9d63c14b436c12cfc693ca40c4e1497729c70
Deleted: sha256:30d81fd61b28fd55d43038fce5f4babcec0de941bdaa82b1f2c0854d4e87dc12
Untagged: ubuntu:latest
Untagged: ubuntu@sha256:7a47ccc3bbe8a451b500d2b53104868b46d60ee8f5b35a24b41a86077c650210
Deleted: sha256:47b19964fb500f3158ae57f20d16d8784cc4af37c52c49d3b4f5bc5eede49541
Deleted: sha256:d4c69838355b876cd3eb0d92b4ef27b1839f5b094a4eb1ad2a1d747dd5d6088f
Deleted: sha256:1c29a32189d8f2738d0d99378dc0912c9f9d289b52fb698bdd6c1c8cd7a33727
Deleted: sha256:d801a12f6af7beff367268f99607376584d8b2da656dcd8656973b7ad9779ab4
Deleted: sha256:bebe7ce6215aee349bee5d67222abeb5c5a834bbeaa2f2f5d05363d9fd68db41
```
17. Check the volume is still there. Remove it.   
```bash
 > docker volume ls
DRIVER              VOLUME NAME
local               myVolume
 > docker volume rm myVolume
myVolume
```
