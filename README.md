# Crypto Box

Ce dépôt décris étape par étape pour créer une `CrytpoBox`.

## Objectif
Fournir une solution permettant à des utilisateurs qui se connaissent de partager sur un réseau local des documents confidentiels stockés sur une solution de stockage externe (ex : clé USB).

## Choix techniques

|||
|:-----------------------|:---------------|
| Système d'exploitation | `Alpine Linux` |
| Serveur web | `NodeJS - express` |
| Serveur DHCP et DNS | `dnsmasq` |
| Chiffrement | `LUKS` |
| Support | `Clef USB` |

### Système d'exploitation
Nous avons décidé d'utiliser la distribution `Alpine Linux`. Elle a l'avantage d'être légère et adaptée au systèmes embarquées. Elle offre toutes les fonctionnalités d'un OS classique comme `CentOS` ou `Debian`.

### Serveur Web
Nous avons utilisé un serveur écrit en `NodeJS`. Il nous permet d'avoir une grande flexibilité pour une faible empreinte mémoire. Le code peut être compilé en binaire statique ce qui facilite son installation sur notre système.
Nous utilisons un certificat SSL x509 afin de chiffrer les échanges entre les utilisateurs et la CryptoBox.

### Serveur DHCP et DNS
Afin de simplifier l'utilisation de notre CrytoBox, nous avons mis en place un serveur DNS pour simplifier l'URL de l'interface web. Nous mettrons aussi en place un serveur DHCP pour configurer automatiquement les adresses IP des clients et le serveur DNS.

### Chiffrement
Afin de protéger les données qui sont téléchargées sur la clef, nous allons les déposer dans une partition chiffrée avec `LUKS`.

## Fonctionnements

Il suffit de brancher la clé USB sur un PC et de booter sur la clef.
Tous les services démarrent immédiatement sans actions manuelles. L'écran de l'ordinateur affiche alors l'URL du service web ainsi que le mot de passe pour accéder à l'interface.

Les utilisateurs voulant utiliser la CrytoBox devront se connecter à l'aide de câbles ethernet. Ils devront récupérer une adresse IP via DHCP.
Il faudra vérifier que le DNS à bien été configuré via le DHCP.

L'interface sera accessible sous l'adresse `https//cloud.hack/`.

Un administrateur devra se connecter et rentrer le mot de passe LUKS afin de déchiffrer le système de fichier.
Les utilisateurs pourrons alors accéder et déposer des fichiers.

Enfin l'administrateur pourra re-chiffrer la partition et partir avec la clef.

## Installation

### Preparation de la clef
Brancher la clé USB sur la la machine Linux.
Lister les disques et trouver celui qui correspond à la clé
```sh
$ fdisk -l
Disque /dev/sdb : 15.5 Go, 15523119104 octets, 30318592 secteurs
Unités = secteur de 1 × 512 = 512 octets
Taille de secteur (logique / physique) : 512 octets / 512 octets
taille d'E/S (minimale / optimale) : 512 octets / 512 octets
Type d'étiquette de disque : dos
Identifiant de disque : 0xd8fe63fd
```

### Partitionnement de la carte SD
Éditer la table des partitions avec la commande `fdisk /dev/sdb`
- Supprimer toutes les partitions avec la touche `d` (à refaire tant qu'il en reste)
- Lister les partitions avec `p`
- Créer une partition avec `n`, une partition primaire `p`, de numéro `1`, premier secteur `2048`, dernier secteur `+8G`
- Ajouter le flag bootable sur cette dernière `a`, puis `1`

Avec la touche `p`, il devrait apparaitre les partitions telles que:
```sh
Commande (m pour l'aide) : p

Disque /dev/sdb : 15.5 Go, 15523119104 octets, 30318592 secteurs
Unités = secteur de 1 × 512 = 512 octets
Taille de secteur (logique / physique) : 512 octets / 512 octets
taille d'E/S (minimale / optimale) : 512 octets / 512 octets
Type d'étiquette de disque : dos
Identifiant de disque : 0xd8fe63fd

Périphérique Amorçage  Début         Fin      Blocs    Id. Système
/dev/sdb1    *       2048      30318591      15027200   83  Linux
```

### Installation d'Alpine
Télécharger l'image RaspberryPi `standard` depuis de le [site d'AlpineLinux](https://alpinelinux.org/downloads/)

Utiliser `QEMU` pour booter l'image alpine
```sh
$ qemu-system-x86_64 -hda /dev/sdb -boot menu=on -drive file=alpine-standard-3.7.0-x86_64.iso
```
Appuyer sur `F12` pour accéder au menu de boot. Choisir l'option `2`
Le système boot alors sur l'image disque d'Alpine

Se connecter en tant que `root`
#### Setup-alpine
Si il y a un proxy
```sh
$ export HTTP_PROXY=<URL_DU_PROXY>
```

Utilisation du script pré-installé d'alpine pour faire les configurations de base
```sh
$ setup-alpine
keyboard layout: fr
variant: fr-azerty
hostname: alpine
initialise interface: eth0
ip address: dhcp
manual config: no
password: ****
timezone: Europe/Paris
proxy: none // Sauf si nécessaire
mirror: dl-cdn.alpinelinux.org
ssh server: none
ntp client: chrony
where to store config: none
cache directory: /tmp/cache
```

Mettre à jour les `apk`:
```sh
$ apk update
```

#### Setup-disk
```sh
$ setup-disk
disk: sda
mode: sys
overwrite: yes
```

### Bonus
#### Ajouter les dépôt de la communauté.
Dans le fichier `/etc/apk/repositories` décommenter la ligne `https://dl-cdn.../comunnity/..`

### Installation et configuration

#### Pré-requis
```
$ apk --no-cache --update add \
  dnsmasq \
  nodejs \
  cryptsetup \
  e2fsprog
```

#### Partition LUKS
Nous allons utiliser un "gros fichier" pour simuler un système de fichier chiffré
Création du fichier luks
```
# Creation du fichier de 4Go
$ fallocate -l 4G data.img

# Association du device loop0 au fichier qu'on vient de créer
$ losetup /dev/loop0 /root/data.img

# Setup de la partition LUKS
$ cryptsetup -y luksFormat -c blowfish -s 256 /dev/loop0
$ cryptsetup luksOpen /dev/loop0 cloud_hack

# Formatage du système de fichier
$ mkfs.ext4 -j /dev/mapper/cloud_hack

# Désassociation
$ losetup -d /dev/loop0
```

#### Configuration réseau

Sous réseau : `192.168.42.0/24`

##### Configuration des interfaces
Editer le fichier de configurations des interfaces `/etc/network/interfaces` eth0 étant l'interface exposée aux clients de la cryptobox. Pour fixer l'adresse IP de la crypto box.
```
auto lo
iface lo inet loopback

auto eth0
iface eth1 inet static
	address 192.168.42.1
	netmask 255.255.255.0
```

##### Configuration d'un serveur DNSMASQ
Nous utiliserons `dnsmasq` pour qu'il émule un serveur DNS et un serveur DHCP

Éditer le fichier de config `/etc/dnsmasq.conf`
```
interface=eth1
# DHCP
dhcp-range=192.168.42.50,192.168.42.150,255.255.255,1h
## dns server
dhcp-option=6,192.168.42.1

# DNS
domain=hack
local=/hack/
## Fichier d'hôtes
addn-hosts=/etc/dnsmasq.hosts
```

Editer ensuite le fichier `/etc/dnsmasq.hosts`, contenant les enregistrements DNS
```
192.168.42.1 cloud.hack
```

Configurer le service `dnsmasq` pour qu'il le lance au démarrage de la machine
```
$ rc-update add dnsmasq boot
```

#### Configuration Système
##### Génération de certificats SSL x509
Nous utiliserons un simple certificat autosigné. Il n'est pas nécessaire qu'il soit généré sur la cryptobox, il peut être importé plus tard.

Création d'une clef privée
```
$ openssl genrsa -out cryptobox.key 2048
```

Création d'une requête de certificat
```
$ cat cryptobox.cnf
[req]
default_bits = 2048
default_keyfile = cryptobox.key
encrypt_key = no
utf8 = yes
distinguished_name = req_distinguished_name
prompt = no

[req_distinguished_name]
countryName = FR
stateOrProvinceName = France
localityName = Lyon
organizationName  = CryptoBox
commonName = cloud.hack
```

Création du certificat x509
```
$ openssl req -x509 -new -nodes \
          -config cryptobox.cnf \
          -key cryptobox.key \
          -sha256 -days 1024 \
          -out cryptobox.crt
```

Nous déposerons le certificat et la clef dans le repertoire `ssl` de notre application.
Il est possible de les mettre ailleurs, dans ce cas il faudra changer le chemin par défaut dans le fichier `config.json` de l'application.

##### Installation et configuration de l'application web
Ce dépôt contient l'ensemble des fichiers nécessaires au fonctionnement de l'application web.
Dans ce tutoriel, nous ne présenterons pas la manière de générer un binaire statique en `nodejs`. Nous exécuterons directement les sources.

Installation des dépendances javascript avec `npm`
```
$ npm install
```

Configurer les options du serveur web dans le fichier `config.json`

Lancer le serveur pour tester avec `npm`
```
$ npm start
```

##### Démarrer l'application au Boot
Nous allons utiliser `inittab` afin de lancer notre application au démarrage à la place d'un `tty`

Modifier le fichier `/etc/inittab`
```diff
- tty1::respawn:/sbin/getty 38400 tty1
+ tty1::respawn:/<path_to_the_app>/scripts/inittab.sh 38400 tty1
```

### Application
Quelques explications s'imposent :)

L'application est un simple serveur web développé avec le framework `express`. On retrouvera le coeur du serveur dans le fichier `index.js`.
Dans le repertoire `routes`, on retrouvera l'ensemble des endpoints `API` de notre application.

Nous chiffrons et déchiffrons le disque `LUKS` avec les scripts `lock.sh` et `unlock.sh` dans le repertoire `scripts`
Les fichiers `html` et `css` sont contenues dans le repertoire `static`

## Evolutions possible
- Chiffrement d'une partition de la clé à la place d'un gros fichier
- Rendre compatible la clé avec un raspberryPI (support de l'architecture `ARM`)
- Mettre en place un service de hotspot wifi (type `hostapd`)
- Créer un certificat SSL root, et générer des certificats enfants pour chacune de nos cryptobox. Permet de ne pas avoir à ajouter tous les certificats dans notre navigateur (seul le root suffit et valide les enfants).
