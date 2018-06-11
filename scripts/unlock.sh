#!/bin/bash

losetup /dev/loop0 /root/data

echo "$1" | cryptsetup luksOpen /dev/loop0 cloud_hack

mount /dev/mapper/cloud_hack /mnt