#!/bin/bash

umount /mnt

cryptsetup luksClose cloud_hack

losetup -d /dev/loop0