/*
Thumper — Micro Planner
Copyright (c) 2026 Paolo Cioli

[IT] Questo programma è software libero: puoi ridistribuirlo e modificarlo
nei termini della GNU Affero General Public License, versione 3, pubblicata
dalla Free Software Foundation. Vedi il file LICENSE. È distribuito nella
speranza che sia utile, ma SENZA ALCUNA GARANZIA.
Per usi che l'AGPL non consente — per esempio incorporarlo in un prodotto
proprietario o rivenderlo senza rilasciare il sorgente — è disponibile una
licenza commerciale: vedi LICENZA-COMMERCIALE.md.
Sviluppato fuori dalle mansioni assegnate e con
mezzi propri. Strumento di uso generale per uffici, non specifico
di alcuna azienda.

[EN] This program is free software: you can redistribute it and/or modify it
under the terms of the GNU Affero General Public License, version 3, as
published by the Free Software Foundation. See the LICENSE file. It is
distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY.
For uses the AGPL does not allow — such as embedding it in a proprietary
product or reselling it without releasing the source — a commercial licence
is available: see LICENZA-COMMERCIALE.md.
Developed outside assigned duties and with personal
means. A general-purpose tool for offices, not specific to any
one company.
*/
"use strict";

const TESTO_LICENZA_AGPL = "                    GNU AFFERO GENERAL PUBLIC LICENSE\n                       Version 3, 19 November 2007\n\n Copyright (C) 2007 Free Software Foundation, Inc. <https://fsf.org/>\n Everyone is permitted to copy and distribute verbatim copies\n of this license document, but changing it is not allowed.\n\n                            Preamble\n\n  The GNU Affero General Public License is a free, copyleft license for\nsoftware and other kinds of works, specifically designed to ensure\ncooperation with the community in the case of network server software.\n\n  The licenses for most software and other practical works are designed\nto take away your freedom to share and change the works.  By contrast,\nour General Public Licenses are intended to guarantee your freedom to\nshare and change all versions of a program--to make sure it remains free\nsoftware for all its users.\n\n  When we speak of free software, we are referring to freedom, not\nprice.  Our General Public Licenses are designed to make sure that you\nhave the freedom to distribute copies of free software (and charge for\nthem if you wish), that you receive source code or can get it if you\nwant it, that you can change the software or use pieces of it in new\nfree programs, and that you know you can do these things.\n\n  Developers that use our General Public Licenses protect your rights\nwith two steps: (1) assert copyright on the software, and (2) offer\nyou this License which gives you legal permission to copy, distribute\nand/or modify the software.\n\n  A secondary benefit of defending all users' freedom is that\nimprovements made in alternate versions of the program, if they\nreceive widespread use, become available for other developers to\nincorporate.  Many developers of free software are heartened and\nencouraged by the resulting cooperation.  However, in the case of\nsoftware used on network servers, this result may fail to come about.\nThe GNU General Public License permits making a modified version and\nletting the public access it on a server without ever releasing its\nsource code to the public.\n\n  The GNU Affero General Public License is designed specifically to\nensure that, in such cases, the modified source code becomes available\nto the community.  It requires the operator of a network server to\nprovide the source code of the modified version running there to the\nusers of that server.  Therefore, public use of a modified version, on\na publicly accessible server, gives the public access to the source\ncode of the modified version.\n\n  An older license, called the Affero General Public License and\npublished by Affero, was designed to accomplish similar goals.  This is\na different license, not a version of the Affero GPL, but Affero has\nreleased a new version of the Affero GPL which permits relicensing under\nthis license.\n\n  The precise terms and conditions for copying, distribution and\nmodification follow.\n\n                       TERMS AND CONDITIONS\n\n  0. Definitions.\n\n  \"This License\" refers to version 3 of the GNU Affero General Public License.\n\n  \"Copyright\" also means copyright-like laws that apply to other kinds of\nworks, such as semiconductor masks.\n\n  \"The Program\" refers to any copyrightable work licensed under this\nLicense.  Each licensee is addressed as \"you\".  \"Licensees\" and\n\"recipients\" may be individuals or organizations.\n\n  To \"modify\" a work means to copy from or adapt all or part of the work\nin a fashion requiring copyright permission, other than the making of an\nexact copy.  The resulting work is called a \"modified version\" of the\nearlier work or a work \"based on\" the earlier work.\n\n  A \"covered work\" means either the unmodified Program or a work based\non the Program.\n\n  To \"propagate\" a work means to do anything with it that, without\npermission, would make you directly or secondarily liable for\ninfringement under applicable copyright law, except executing it on a\ncomputer or modifying a private copy.  Propagation includes copying,\ndistribution (with or without modification), making available to the\npublic, and in some countries other activities as well.\n\n  To \"convey\" a work means any kind of propagation that enables other\nparties to make or receive copies.  Mere interaction with a user through\na computer network, with no transfer of a copy, is not conveying.\n\n  An interactive user interface displays \"Appropriate Legal Notices\"\nto the extent that it includes a convenient and prominently visible\nfeature that (1) displays an appropriate copyright notice, and (2)\ntells the user that there is no warranty for the work (except to the\nextent that warranties are provided), that licensees may convey the\nwork under this License, and how to view a copy of this License.  If\nthe interface presents a list of user commands or options, such as a\nmenu, a prominent item in the list meets this criterion.\n\n  1. Source Code.\n\n  The \"source code\" for a work means the preferred form of the work\nfor making modifications to it.  \"Object code\" means any non-source\nform of a work.\n\n  A \"Standard Interface\" means an interface that either is an official\nstandard defined by a recognized standards body, or, in the case of\ninterfaces specified for a particular programming language, one that\nis widely used among developers working in that language.\n\n  The \"System Libraries\" of an executable work include anything, other\nthan the work as a whole, that (a) is included in the normal form of\npackaging a Major Component, but which is not part of that Major\nComponent, and (b) serves only to enable use of the work with that\nMajor Component, or to implement a Standard Interface for which an\nimplementation is available to the public in source code form.  A\n\"Major Component\", in this context, means a major essential component\n(kernel, window system, and so on) of the specific operating system\n(if any) on which the executable work runs, or a compiler used to\nproduce the work, or an object code interpreter used to run it.\n\n  The \"Corresponding Source\" for a work in object code form means all\nthe source code needed to generate, install, and (for an executable\nwork) run the object code and to modify the work, including scripts to\ncontrol those activities.  However, it does not include the work's\nSystem Libraries, or general-purpose tools or generally available free\nprograms which are used unmodified in performing those activities but\nwhich are not part of the work.  For example, Corresponding Source\nincludes interface definition files associated with source files for\nthe work, and the source code for shared libraries and dynamically\nlinked subprograms that the work is specifically designed to require,\nsuch as by intimate data communication or control flow between those\nsubprograms and other parts of the work.\n\n  The Corresponding Source need not include anything that users\ncan regenerate automatically from other parts of the Corresponding\nSource.\n\n  The Corresponding Source for a work in source code form is that\nsame work.\n\n  2. Basic Permissions.\n\n  All rights granted under this License are granted for the term of\ncopyright on the Program, and are irrevocable provided the stated\nconditions are met.  This License explicitly affirms your unlimited\npermission to run the unmodified Program.  The output from running a\ncovered work is covered by this License only if the output, given its\ncontent, constitutes a covered work.  This License acknowledges your\nrights of fair use or other equivalent, as provided by copyright law.\n\n  You may make, run and propagate covered works that you do not\nconvey, without conditions so long as your license otherwise remains\nin force.  You may convey covered works to others for the sole purpose\nof having them make modifications exclusively for you, or provide you\nwith facilities for running those works, provided that you comply with\nthe terms of this License in conveying all material for which you do\nnot control copyright.  Those thus making or running the covered works\nfor you must do so exclusively on your behalf, under your direction\nand control, on terms that prohibit them from making any copies of\nyour copyrighted material outside their relationship with you.\n\n  Conveying under any other circumstances is permitted solely under\nthe conditions stated below.  Sublicensing is not allowed; section 10\nmakes it unnecessary.\n\n  3. Protecting Users' Legal Rights From Anti-Circumvention Law.\n\n  No covered work shall be deemed part of an effective technological\nmeasure under any applicable law fulfilling obligations under article\n11 of the WIPO copyright treaty adopted on 20 December 1996, or\nsimilar laws prohibiting or restricting circumvention of such\nmeasures.\n\n  When you convey a covered work, you waive any legal power to forbid\ncircumvention of technological measures to the extent such circumvention\nis effected by exercising rights under this License with respect to\nthe covered work, and you disclaim any intention to limit operation or\nmodification of the work as a means of enforcing, against the work's\nusers, your or third parties' legal rights to forbid circumvention of\ntechnological measures.\n\n  4. Conveying Verbatim Copies.\n\n  You may convey verbatim copies of the Program's source code as you\nreceive it, in any medium, provided that you conspicuously and\nappropriately publish on each copy an appropriate copyright notice;\nkeep intact all notices stating that this License and any\nnon-permissive terms added in accord with section 7 apply to the code;\nkeep intact all notices of the absence of any warranty; and give all\nrecipients a copy of this License along with the Program.\n\n  You may charge any price or no price for each copy that you convey,\nand you may offer support or warranty protection for a fee.\n\n  5. Conveying Modified Source Versions.\n\n  You may convey a work based on the Program, or the modifications to\nproduce it from the Program, in the form of source code under the\nterms of section 4, provided that you also meet all of these conditions:\n\n    a) The work must carry prominent notices stating that you modified\n    it, and giving a relevant date.\n\n    b) The work must carry prominent notices stating that it is\n    released under this License and any conditions added under section\n    7.  This requirement modifies the requirement in section 4 to\n    \"keep intact all notices\".\n\n    c) You must license the entire work, as a whole, under this\n    License to anyone who comes into possession of a copy.  This\n    License will therefore apply, along with any applicable section 7\n    additional terms, to the whole of the work, and all its parts,\n    regardless of how they are packaged.  This License gives no\n    permission to license the work in any other way, but it does not\n    invalidate such permission if you have separately received it.\n\n    d) If the work has interactive user interfaces, each must display\n    Appropriate Legal Notices; however, if the Program has interactive\n    interfaces that do not display Appropriate Legal Notices, your\n    work need not make them do so.\n\n  A compilation of a covered work with other separate and independent\nworks, which are not by their nature extensions of the covered work,\nand which are not combined with it such as to form a larger program,\nin or on a volume of a storage or distribution medium, is called an\n\"aggregate\" if the compilation and its resulting copyright are not\nused to limit the access or legal rights of the compilation's users\nbeyond what the individual works permit.  Inclusion of a covered work\nin an aggregate does not cause this License to apply to the other\nparts of the aggregate.\n\n  6. Conveying Non-Source Forms.\n\n  You may convey a covered work in object code form under the terms\nof sections 4 and 5, provided that you also convey the\nmachine-readable Corresponding Source under the terms of this License,\nin one of these ways:\n\n    a) Convey the object code in, or embodied in, a physical product\n    (including a physical distribution medium), accompanied by the\n    Corresponding Source fixed on a durable physical medium\n    customarily used for software interchange.\n\n    b) Convey the object code in, or embodied in, a physical product\n    (including a physical distribution medium), accompanied by a\n    written offer, valid for at least three years and valid for as\n    long as you offer spare parts or customer support for that product\n    model, to give anyone who possesses the object code either (1) a\n    copy of the Corresponding Source for all the software in the\n    product that is covered by this License, on a durable physical\n    medium customarily used for software interchange, for a price no\n    more than your reasonable cost of physically performing this\n    conveying of source, or (2) access to copy the\n    Corresponding Source from a network server at no charge.\n\n    c) Convey individual copies of the object code with a copy of the\n    written offer to provide the Corresponding Source.  This\n    alternative is allowed only occasionally and noncommercially, and\n    only if you received the object code with such an offer, in accord\n    with subsection 6b.\n\n    d) Convey the object code by offering access from a designated\n    place (gratis or for a charge), and offer equivalent access to the\n    Corresponding Source in the same way through the same place at no\n    further charge.  You need not require recipients to copy the\n    Corresponding Source along with the object code.  If the place to\n    copy the object code is a network server, the Corresponding Source\n    may be on a different server (operated by you or a third party)\n    that supports equivalent copying facilities, provided you maintain\n    clear directions next to the object code saying where to find the\n    Corresponding Source.  Regardless of what server hosts the\n    Corresponding Source, you remain obligated to ensure that it is\n    available for as long as needed to satisfy these requirements.\n\n    e) Convey the object code using peer-to-peer transmission, provided\n    you inform other peers where the object code and Corresponding\n    Source of the work are being offered to the general public at no\n    charge under subsection 6d.\n\n  A separable portion of the object code, whose source code is excluded\nfrom the Corresponding Source as a System Library, need not be\nincluded in conveying the object code work.\n\n  A \"User Product\" is either (1) a \"consumer product\", which means any\ntangible personal property which is normally used for personal, family,\nor household purposes, or (2) anything designed or sold for incorporation\ninto a dwelling.  In determining whether a product is a consumer product,\ndoubtful cases shall be resolved in favor of coverage.  For a particular\nproduct received by a particular user, \"normally used\" refers to a\ntypical or common use of that class of product, regardless of the status\nof the particular user or of the way in which the particular user\nactually uses, or expects or is expected to use, the product.  A product\nis a consumer product regardless of whether the product has substantial\ncommercial, industrial or non-consumer uses, unless such uses represent\nthe only significant mode of use of the product.\n\n  \"Installation Information\" for a User Product means any methods,\nprocedures, authorization keys, or other information required to install\nand execute modified versions of a covered work in that User Product from\na modified version of its Corresponding Source.  The information must\nsuffice to ensure that the continued functioning of the modified object\ncode is in no case prevented or interfered with solely because\nmodification has been made.\n\n  If you convey an object code work under this section in, or with, or\nspecifically for use in, a User Product, and the conveying occurs as\npart of a transaction in which the right of possession and use of the\nUser Product is transferred to the recipient in perpetuity or for a\nfixed term (regardless of how the transaction is characterized), the\nCorresponding Source conveyed under this section must be accompanied\nby the Installation Information.  But this requirement does not apply\nif neither you nor any third party retains the ability to install\nmodified object code on the User Product (for example, the work has\nbeen installed in ROM).\n\n  The requirement to provide Installation Information does not include a\nrequirement to continue to provide support service, warranty, or updates\nfor a work that has been modified or installed by the recipient, or for\nthe User Product in which it has been modified or installed.  Access to a\nnetwork may be denied when the modification itself materially and\nadversely affects the operation of the network or violates the rules and\nprotocols for communication across the network.\n\n  Corresponding Source conveyed, and Installation Information provided,\nin accord with this section must be in a format that is publicly\ndocumented (and with an implementation available to the public in\nsource code form), and must require no special password or key for\nunpacking, reading or copying.\n\n  7. Additional Terms.\n\n  \"Additional permissions\" are terms that supplement the terms of this\nLicense by making exceptions from one or more of its conditions.\nAdditional permissions that are applicable to the entire Program shall\nbe treated as though they were included in this License, to the extent\nthat they are valid under applicable law.  If additional permissions\napply only to part of the Program, that part may be used separately\nunder those permissions, but the entire Program remains governed by\nthis License without regard to the additional permissions.\n\n  When you convey a copy of a covered work, you may at your option\nremove any additional permissions from that copy, or from any part of\nit.  (Additional permissions may be written to require their own\nremoval in certain cases when you modify the work.)  You may place\nadditional permissions on material, added by you to a covered work,\nfor which you have or can give appropriate copyright permission.\n\n  Notwithstanding any other provision of this License, for material you\nadd to a covered work, you may (if authorized by the copyright holders of\nthat material) supplement the terms of this License with terms:\n\n    a) Disclaiming warranty or limiting liability differently from the\n    terms of sections 15 and 16 of this License; or\n\n    b) Requiring preservation of specified reasonable legal notices or\n    author attributions in that material or in the Appropriate Legal\n    Notices displayed by works containing it; or\n\n    c) Prohibiting misrepresentation of the origin of that material, or\n    requiring that modified versions of such material be marked in\n    reasonable ways as different from the original version; or\n\n    d) Limiting the use for publicity purposes of names of licensors or\n    authors of the material; or\n\n    e) Declining to grant rights under trademark law for use of some\n    trade names, trademarks, or service marks; or\n\n    f) Requiring indemnification of licensors and authors of that\n    material by anyone who conveys the material (or modified versions of\n    it) with contractual assumptions of liability to the recipient, for\n    any liability that these contractual assumptions directly impose on\n    those licensors and authors.\n\n  All other non-permissive additional terms are considered \"further\nrestrictions\" within the meaning of section 10.  If the Program as you\nreceived it, or any part of it, contains a notice stating that it is\ngoverned by this License along with a term that is a further\nrestriction, you may remove that term.  If a license document contains\na further restriction but permits relicensing or conveying under this\nLicense, you may add to a covered work material governed by the terms\nof that license document, provided that the further restriction does\nnot survive such relicensing or conveying.\n\n  If you add terms to a covered work in accord with this section, you\nmust place, in the relevant source files, a statement of the\nadditional terms that apply to those files, or a notice indicating\nwhere to find the applicable terms.\n\n  Additional terms, permissive or non-permissive, may be stated in the\nform of a separately written license, or stated as exceptions;\nthe above requirements apply either way.\n\n  8. Termination.\n\n  You may not propagate or modify a covered work except as expressly\nprovided under this License.  Any attempt otherwise to propagate or\nmodify it is void, and will automatically terminate your rights under\nthis License (including any patent licenses granted under the third\nparagraph of section 11).\n\n  However, if you cease all violation of this License, then your\nlicense from a particular copyright holder is reinstated (a)\nprovisionally, unless and until the copyright holder explicitly and\nfinally terminates your license, and (b) permanently, if the copyright\nholder fails to notify you of the violation by some reasonable means\nprior to 60 days after the cessation.\n\n  Moreover, your license from a particular copyright holder is\nreinstated permanently if the copyright holder notifies you of the\nviolation by some reasonable means, this is the first time you have\nreceived notice of violation of this License (for any work) from that\ncopyright holder, and you cure the violation prior to 30 days after\nyour receipt of the notice.\n\n  Termination of your rights under this section does not terminate the\nlicenses of parties who have received copies or rights from you under\nthis License.  If your rights have been terminated and not permanently\nreinstated, you do not qualify to receive new licenses for the same\nmaterial under section 10.\n\n  9. Acceptance Not Required for Having Copies.\n\n  You are not required to accept this License in order to receive or\nrun a copy of the Program.  Ancillary propagation of a covered work\noccurring solely as a consequence of using peer-to-peer transmission\nto receive a copy likewise does not require acceptance.  However,\nnothing other than this License grants you permission to propagate or\nmodify any covered work.  These actions infringe copyright if you do\nnot accept this License.  Therefore, by modifying or propagating a\ncovered work, you indicate your acceptance of this License to do so.\n\n  10. Automatic Licensing of Downstream Recipients.\n\n  Each time you convey a covered work, the recipient automatically\nreceives a license from the original licensors, to run, modify and\npropagate that work, subject to this License.  You are not responsible\nfor enforcing compliance by third parties with this License.\n\n  An \"entity transaction\" is a transaction transferring control of an\norganization, or substantially all assets of one, or subdividing an\norganization, or merging organizations.  If propagation of a covered\nwork results from an entity transaction, each party to that\ntransaction who receives a copy of the work also receives whatever\nlicenses to the work the party's predecessor in interest had or could\ngive under the previous paragraph, plus a right to possession of the\nCorresponding Source of the work from the predecessor in interest, if\nthe predecessor has it or can get it with reasonable efforts.\n\n  You may not impose any further restrictions on the exercise of the\nrights granted or affirmed under this License.  For example, you may\nnot impose a license fee, royalty, or other charge for exercise of\nrights granted under this License, and you may not initiate litigation\n(including a cross-claim or counterclaim in a lawsuit) alleging that\nany patent claim is infringed by making, using, selling, offering for\nsale, or importing the Program or any portion of it.\n\n  11. Patents.\n\n  A \"contributor\" is a copyright holder who authorizes use under this\nLicense of the Program or a work on which the Program is based.  The\nwork thus licensed is called the contributor's \"contributor version\".\n\n  A contributor's \"essential patent claims\" are all patent claims\nowned or controlled by the contributor, whether already acquired or\nhereafter acquired, that would be infringed by some manner, permitted\nby this License, of making, using, or selling its contributor version,\nbut do not include claims that would be infringed only as a\nconsequence of further modification of the contributor version.  For\npurposes of this definition, \"control\" includes the right to grant\npatent sublicenses in a manner consistent with the requirements of\nthis License.\n\n  Each contributor grants you a non-exclusive, worldwide, royalty-free\npatent license under the contributor's essential patent claims, to\nmake, use, sell, offer for sale, import and otherwise run, modify and\npropagate the contents of its contributor version.\n\n  In the following three paragraphs, a \"patent license\" is any express\nagreement or commitment, however denominated, not to enforce a patent\n(such as an express permission to practice a patent or covenant not to\nsue for patent infringement).  To \"grant\" such a patent license to a\nparty means to make such an agreement or commitment not to enforce a\npatent against the party.\n\n  If you convey a covered work, knowingly relying on a patent license,\nand the Corresponding Source of the work is not available for anyone\nto copy, free of charge and under the terms of this License, through a\npublicly available network server or other readily accessible means,\nthen you must either (1) cause the Corresponding Source to be so\navailable, or (2) arrange to deprive yourself of the benefit of the\npatent license for this particular work, or (3) arrange, in a manner\nconsistent with the requirements of this License, to extend the patent\nlicense to downstream recipients.  \"Knowingly relying\" means you have\nactual knowledge that, but for the patent license, your conveying the\ncovered work in a country, or your recipient's use of the covered work\nin a country, would infringe one or more identifiable patents in that\ncountry that you have reason to believe are valid.\n\n  If, pursuant to or in connection with a single transaction or\narrangement, you convey, or propagate by procuring conveyance of, a\ncovered work, and grant a patent license to some of the parties\nreceiving the covered work authorizing them to use, propagate, modify\nor convey a specific copy of the covered work, then the patent license\nyou grant is automatically extended to all recipients of the covered\nwork and works based on it.\n\n  A patent license is \"discriminatory\" if it does not include within\nthe scope of its coverage, prohibits the exercise of, or is\nconditioned on the non-exercise of one or more of the rights that are\nspecifically granted under this License.  You may not convey a covered\nwork if you are a party to an arrangement with a third party that is\nin the business of distributing software, under which you make payment\nto the third party based on the extent of your activity of conveying\nthe work, and under which the third party grants, to any of the\nparties who would receive the covered work from you, a discriminatory\npatent license (a) in connection with copies of the covered work\nconveyed by you (or copies made from those copies), or (b) primarily\nfor and in connection with specific products or compilations that\ncontain the covered work, unless you entered into that arrangement,\nor that patent license was granted, prior to 28 March 2007.\n\n  Nothing in this License shall be construed as excluding or limiting\nany implied license or other defenses to infringement that may\notherwise be available to you under applicable patent law.\n\n  12. No Surrender of Others' Freedom.\n\n  If conditions are imposed on you (whether by court order, agreement or\notherwise) that contradict the conditions of this License, they do not\nexcuse you from the conditions of this License.  If you cannot convey a\ncovered work so as to satisfy simultaneously your obligations under this\nLicense and any other pertinent obligations, then as a consequence you may\nnot convey it at all.  For example, if you agree to terms that obligate you\nto collect a royalty for further conveying from those to whom you convey\nthe Program, the only way you could satisfy both those terms and this\nLicense would be to refrain entirely from conveying the Program.\n\n  13. Remote Network Interaction; Use with the GNU General Public License.\n\n  Notwithstanding any other provision of this License, if you modify the\nProgram, your modified version must prominently offer all users\ninteracting with it remotely through a computer network (if your version\nsupports such interaction) an opportunity to receive the Corresponding\nSource of your version by providing access to the Corresponding Source\nfrom a network server at no charge, through some standard or customary\nmeans of facilitating copying of software.  This Corresponding Source\nshall include the Corresponding Source for any work covered by version 3\nof the GNU General Public License that is incorporated pursuant to the\nfollowing paragraph.\n\n  Notwithstanding any other provision of this License, you have\npermission to link or combine any covered work with a work licensed\nunder version 3 of the GNU General Public License into a single\ncombined work, and to convey the resulting work.  The terms of this\nLicense will continue to apply to the part which is the covered work,\nbut the work with which it is combined will remain governed by version\n3 of the GNU General Public License.\n\n  14. Revised Versions of this License.\n\n  The Free Software Foundation may publish revised and/or new versions of\nthe GNU Affero General Public License from time to time.  Such new versions\nwill be similar in spirit to the present version, but may differ in detail to\naddress new problems or concerns.\n\n  Each version is given a distinguishing version number.  If the\nProgram specifies that a certain numbered version of the GNU Affero General\nPublic License \"or any later version\" applies to it, you have the\noption of following the terms and conditions either of that numbered\nversion or of any later version published by the Free Software\nFoundation.  If the Program does not specify a version number of the\nGNU Affero General Public License, you may choose any version ever published\nby the Free Software Foundation.\n\n  If the Program specifies that a proxy can decide which future\nversions of the GNU Affero General Public License can be used, that proxy's\npublic statement of acceptance of a version permanently authorizes you\nto choose that version for the Program.\n\n  Later license versions may give you additional or different\npermissions.  However, no additional obligations are imposed on any\nauthor or copyright holder as a result of your choosing to follow a\nlater version.\n\n  15. Disclaimer of Warranty.\n\n  THERE IS NO WARRANTY FOR THE PROGRAM, TO THE EXTENT PERMITTED BY\nAPPLICABLE LAW.  EXCEPT WHEN OTHERWISE STATED IN WRITING THE COPYRIGHT\nHOLDERS AND/OR OTHER PARTIES PROVIDE THE PROGRAM \"AS IS\" WITHOUT WARRANTY\nOF ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING, BUT NOT LIMITED TO,\nTHE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR\nPURPOSE.  THE ENTIRE RISK AS TO THE QUALITY AND PERFORMANCE OF THE PROGRAM\nIS WITH YOU.  SHOULD THE PROGRAM PROVE DEFECTIVE, YOU ASSUME THE COST OF\nALL NECESSARY SERVICING, REPAIR OR CORRECTION.\n\n  16. Limitation of Liability.\n\n  IN NO EVENT UNLESS REQUIRED BY APPLICABLE LAW OR AGREED TO IN WRITING\nWILL ANY COPYRIGHT HOLDER, OR ANY OTHER PARTY WHO MODIFIES AND/OR CONVEYS\nTHE PROGRAM AS PERMITTED ABOVE, BE LIABLE TO YOU FOR DAMAGES, INCLUDING ANY\nGENERAL, SPECIAL, INCIDENTAL OR CONSEQUENTIAL DAMAGES ARISING OUT OF THE\nUSE OR INABILITY TO USE THE PROGRAM (INCLUDING BUT NOT LIMITED TO LOSS OF\nDATA OR DATA BEING RENDERED INACCURATE OR LOSSES SUSTAINED BY YOU OR THIRD\nPARTIES OR A FAILURE OF THE PROGRAM TO OPERATE WITH ANY OTHER PROGRAMS),\nEVEN IF SUCH HOLDER OR OTHER PARTY HAS BEEN ADVISED OF THE POSSIBILITY OF\nSUCH DAMAGES.\n\n  17. Interpretation of Sections 15 and 16.\n\n  If the disclaimer of warranty and limitation of liability provided\nabove cannot be given local legal effect according to their terms,\nreviewing courts shall apply local law that most closely approximates\nan absolute waiver of all civil liability in connection with the\nProgram, unless a warranty or assumption of liability accompanies a\ncopy of the Program in return for a fee.\n\n                     END OF TERMS AND CONDITIONS\n\n            How to Apply These Terms to Your New Programs\n\n  If you develop a new program, and you want it to be of the greatest\npossible use to the public, the best way to achieve this is to make it\nfree software which everyone can redistribute and change under these terms.\n\n  To do so, attach the following notices to the program.  It is safest\nto attach them to the start of each source file to most effectively\nstate the exclusion of warranty; and each file should have at least\nthe \"copyright\" line and a pointer to where the full notice is found.\n\n    <one line to give the program's name and a brief idea of what it does.>\n    Copyright (C) <year>  <name of author>\n\n    This program is free software: you can redistribute it and/or modify\n    it under the terms of the GNU Affero General Public License as published by\n    the Free Software Foundation, either version 3 of the License, or\n    (at your option) any later version.\n\n    This program is distributed in the hope that it will be useful,\n    but WITHOUT ANY WARRANTY; without even the implied warranty of\n    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n    GNU Affero General Public License for more details.\n\n    You should have received a copy of the GNU Affero General Public License\n    along with this program.  If not, see <https://www.gnu.org/licenses/>.\n\nAlso add information on how to contact you by electronic and paper mail.\n\n  If your software can interact with users remotely through a computer\nnetwork, you should also make sure that it provides a way for users to\nget its source.  For example, if your program is a web application, its\ninterface could display a \"Source\" link that leads users to an archive\nof the code.  There are many ways you could offer source, and different\nsolutions will be better for different programs; see section 13 for the\nspecific requirements.\n\n  You should also get your employer (if you work as a programmer) or school,\nif any, to sign a \"copyright disclaimer\" for the program, if necessary.\nFor more information on this, and how to apply and follow the GNU AGPL, see\n<https://www.gnu.org/licenses/>.\n";

/* ==========================================================
   9. RENDER — IMPOSTAZIONI
   ========================================================== */
function rendiImpostazioni(){
  const anno = V.annoFest;
  const fest = Object.entries(festivitaAnno(anno))
    .map(([k,v]) => ({k, nome:v.nome}))
    .sort((a,b)=> a.k < b.k ? -1 : 1);
  const anteprimaFest = V.calAnteprima === "attivo" ? fest : vociAnnoPresetFestivita(V.calAnteprima, anno);
  const chiusure = (S.config.chiusure||[]).map((c,i)=>
    `<tr><td>${esc(c.nome||"Chiusura")}</td><td class="mono">${itData(c.dal)}</td><td class="mono">${itData(c.al)}</td>
     <td style="text-align:right"><button class="btn piccolo pericolo" data-del-chiusura="${i}">Elimina</button></td></tr>`).join("")
    || '<tr><td colspan="4" style="color:var(--tenue)">Nessuna chiusura aziendale.</td></tr>';

  const nomiSett = {1:"Lunedì",2:"Martedì",3:"Mercoledì",4:"Giovedì",5:"Venerdì",6:"Sabato",0:"Domenica"};
  const gl = [1,2,3,4,5,6,0].map(n=>{
    const attivo = S.config.giorniLavorativi.includes(n);
    const v = (S.config.oreGiorniSettimana||{})[n];
    const ore = (v != null && v !== "") ? +v : 8;
    return `<tr class="${attivo?"":"spenta"}">
      <td><label class="spunta"><input type="checkbox" data-giorno="${n}" ${attivo?"checked":""}> ${nomiSett[n]}</label></td>
      <td class="num-cella"><input type="number" style="width:90px" data-oregiorno="${n}" min="0.5" step="0.5"
        value="${ore}" ${attivo&&modificabile?"":"disabled"}></td>
      <td class="nota">${!attivo ? tr("giorno non lavorativo") : ""}</td></tr>`;
  }).join("");

  const sez = {};
  sez.calendario = `
    <div class="pannello">
      <h2 class="din">Orario e calendario</h2>
      <div class="riga-campi">
        <div class="campo"><label for="cfg-efficienza">Coefficiente di efficienza (%)</label>
          <input type="number" id="cfg-efficienza" min="1" max="300" step="1" value="${Math.round((S.config.efficienza!=null?S.config.efficienza:1)*100)}">
          <span class="aiuto">Riduce le ore dei giorni lavorativi per ottenere il tempo davvero disponibile a pianificare: Ore × coefficiente. Lascia 100% per nessuna riduzione.</span></div>
        <div class="campo"><label for="cfg-smart">Giorni di smart working a settimana</label>
          <input type="number" id="cfg-smart" min="0" max="7" step="1" value="${S.config.smartMaxSettimana}">
          <span class="aiuto">Limite generale. Le deroghe individuali si impostano sulla singola persona.</span></div>
      </div>
      <h3>Giorni lavorativi</h3>
      <p class="nota">Le ore di ogni giorno sono la fonte: valgono per tutti. Chi in anagrafica ha un orario personale più corto (part-time) resta sul proprio; un orario personale più lungo non supera comunque il tetto del giorno.</p>
      <table class="tabella-editabile" style="max-width:560px"><thead><tr><th>Giorno</th><th class="num-cella" style="width:110px">Ore</th><th></th></tr></thead>
      <tbody>${gl}</tbody></table>
    </div>
    <div class="pannello">
      <h2 class="din">Chiusure e festività aggiuntive</h2>
      <p class="nota">Periodi in cui l'ufficio è chiuso: ponti, chiusura estiva, santo patrono. Si comportano come festività per tutti.</p>
      <table><thead><tr><th>Nome</th><th>Dal</th><th>Al</th><th></th></tr></thead><tbody>${chiusure}</tbody></table>
      <div class="riga-campi" style="margin-top:12px;align-items:flex-end">
        <div class="campo"><label for="ch-nome">Nome</label><input type="text" id="ch-nome" placeholder="Chiusura estiva"></div>
        <div class="campo"><label for="ch-dal">Dal</label><input type="date" id="ch-dal"></div>
        <div class="campo"><label for="ch-al">Al</label><input type="date" id="ch-al"></div>
        <div class="campo"><label>&nbsp;</label><button class="btn" id="ch-aggiungi">Aggiungi</button></div>
      </div>
    </div>
    <div class="pannello">
      <h2 class="din" style="margin:0 0 4px">Applica calendario nazionale</h2>
      <p class="nota">Sostituisce l'intero elenco festività qui sotto con un preset già pronto —
      un'azione una tantum, non un confronto (per confrontare usa "Calendario" nell'Anteprima più
      sotto).</p>
      <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
        <div class="campo" style="margin-bottom:0;max-width:220px">
          <label for="preset-nazionale">Paese</label>
          <select id="preset-nazionale">
            ${Object.keys(PRESET_FESTIVITA).map(p=>`<option value="${p}">${NOME_PAESE_PRESET[p]}</option>`).join("")}
          </select>
        </div>
        <div style="display:flex;flex-direction:column;gap:3px;flex:1 1 260px">
          <label style="visibility:hidden;font-size:11px" aria-hidden="true">&nbsp;</label>
          <span class="aiuto" id="preset-fuso">${testoFusoPreset(Object.keys(PRESET_FESTIVITA)[0])}</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:3px">
          <label style="visibility:hidden;font-size:11px" aria-hidden="true">&nbsp;</label>
          <button class="btn primario" id="preset-applica">Applica</button>
        </div>
      </div>
    </div>
    <div class="pannello">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px;flex-wrap:wrap">
        <h2 class="din" style="margin:0">Festività nazionali</h2>
        <button class="btn primario" style="margin-left:auto" data-mod-festivita="">+ Nuova festività</button>
      </div>
      <p class="nota">Questo calendario viene usato nei calcoli di capacità. Valgono per qualunque
      anno: a data fissa, relative a Pasqua (es. Lunedì dell'Angelo) o all'N-esimo giorno della
      settimana di un mese (es. il quarto giovedì di novembre). Ponti, patrono e chiusure
      straordinarie vanno invece nel riquadro qui sopra.</p>
      <table><thead><tr><th>Nome</th><th>Quando</th><th></th></tr></thead><tbody>
      ${(S.config.festivitaNazionali||[]).map(v=>`<tr><td>${esc(v.nome)}</td><td>${esc(testoVoceFestivita(v))}</td>
        <td style="text-align:right"><button class="btn piccolo" data-mod-festivita="${v.id}">Modifica</button></td></tr>`).join("")
        || '<tr><td colspan="3" style="color:var(--tenue);padding:14px">Nessuna festività nazionale impostata.</td></tr>'}
      </tbody></table>
    </div>
    <div class="pannello">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
        <h3 style="margin:0">Anteprima</h3>
        <button class="btn piccolo" id="fest-prec">◀</button>
        <b class="mono din" style="font-size:15px">${anno}</b>
        <button class="btn piccolo" id="fest-succ">▶</button>
      </div>
      <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:10px">
        <div class="campo" style="margin-bottom:0;max-width:220px">
          <label for="anteprima-calendario">Calendario</label>
          <select id="anteprima-calendario">
            <option value="attivo" ${V.calAnteprima==="attivo"?"selected":""}>Il mio calendario (attivo)</option>
            ${Object.keys(PRESET_FESTIVITA).map(p=>`<option value="${p}" ${V.calAnteprima===p?"selected":""}>${NOME_PAESE_PRESET[p]}</option>`).join("")}
          </select>
        </div>
        <div style="display:flex;flex-direction:column;gap:3px;flex:1 1 320px">
          <label style="visibility:hidden;font-size:11px" aria-hidden="true">&nbsp;</label>
          <span class="aiuto">${V.calAnteprima==="attivo"
            ? tr("A quali date corrispondono le festività qui sopra, per l'anno selezionato.")
            : tr("Cambia solo cosa vedi qui sotto, non tocca il calendario attivo.") + " " + testoFusoPreset(V.calAnteprima)}</span>
        </div>
      </div>
      <table><tbody>${anteprimaFest.map(f=>{
        const gs = d(f.k).getDay();
        return `<tr><td class="mono" style="width:110px">${itData(f.k)}</td>
          <td style="width:90px;color:var(--tenue)">${["domenica","lunedì","martedì","mercoledì","giovedì","venerdì","sabato"][gs]}</td>
          <td>${esc(f.nome)}</td></tr>`;
      }).join("") || '<tr><td colspan="3" style="color:var(--tenue);padding:14px">Nessuna festività per questo anno.</td></tr>'}</tbody></table>
    </div>
`;
  sez.tempi = `
    <div class="pannello">
      <h2 class="din">Lead time e date limite</h2>
      <label for="cfg-margine" class="h3">Margine di sicurezza (giorni lavorativi)</label>
      <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:14px">
        <div class="campo" style="margin-bottom:0;max-width:110px">
          <input type="number" id="cfg-margine" min="0" step="1" value="${S.config.margineGiorni||0}">
        </div>
        <span class="aiuto">${tr('Cuscinetto in giorni lavorativi dell\'ufficio, tolto in aggiunta ai lead time (che restano di calendario). Lascia 0 se non lo usi.')}</span>
      </div>

      <h3>Fornitura esterna</h3>
      <p class="nota">${tr('Elenca le forniture critiche con il loro tempo di consegna. Il calcolo usa sempre la voce più lunga:\n      è quella che detta i tempi, le altre servono a ricordare da dove esce il numero.')}</p>
      <table class="tabella-editabile"><thead><tr><th>Descrizione</th><th class="num-cella" style="width:90px">Tempo</th><th style="width:110px">Giorni/settimane</th><th style="width:110px"></th><th style="width:160px"></th></tr></thead><tbody>
      ${/* la colonna vuota tiene il posto di "Fornitura est." della tabella sotto: le due tabelle sono impilate e le colonne devono coincidere */""}
      ${(S.config.leadFornitura||[]).map(v=>{
        const sbloccata = V.leadModifica.has(v.id);
        const attiva = modificabile && sbloccata;
        return `<tr>
        <td><input type="text" data-lf-nome="${v.id}" value="${esc(v.nome)}" ${attiva?"":"disabled"}></td>
        <td><input type="number" class="num-cella" data-lf-valore="${v.id}" min="0" step="0.5" value="${v.valore}" ${attiva?"":"disabled"}></td>
        <td><select data-lf-unita="${v.id}" ${attiva?"":"disabled"}>
          <option value="settimane" ${v.unita!=="giorni"?"selected":""}>settimane</option>
          <option value="giorni" ${v.unita==="giorni"?"selected":""}>giorni</option></select></td>
        <td></td>
        <td style="text-align:right;white-space:nowrap">
          <button class="btn piccolo" data-modifica-forn="${v.id}">${sbloccata?tr("Fatto"):tr("Modifica")}</button>
          <button class="btn piccolo pericolo" data-del-forn="${v.id}">Elimina</button></td></tr>`;
      }).join("")
      || `<tr><td colspan="5" style="color:var(--tenue)">${tr('Nessun lead time di fornitura esterna: il calcolo lo considera zero.')}</td></tr>`}
      <tr>
        <td><input type="text" id="lf-nome" placeholder="Descrizione" aria-label="Descrizione"></td>
        <td><input type="number" class="num-cella" id="lf-valore" min="0" step="0.5" placeholder="10" aria-label="Tempo"></td>
        <td><select id="lf-unita" aria-label="Giorni/settimane"><option value="settimane" selected>settimane</option><option value="giorni">giorni</option></select></td>
        <td></td>
        <td style="text-align:right"><button class="btn piccolo" id="lf-aggiungi">Aggiungi</button></td></tr>
      </tbody></table>

      <h3>Sviluppo interno</h3>
      <p class="nota">${tr('Una riga per tipologia di sviluppo interno. La tipologia si assegna poi al singolo progetto, nella sua scheda.')}</p>
      <table class="tabella-editabile"><thead><tr><th>Descrizione</th><th class="num-cella" style="width:90px">Tempo</th><th style="width:110px">Giorni/settimane</th><th style="width:110px">Fornitura est.</th><th style="width:160px"></th></tr></thead><tbody>
      ${(S.config.leadProduzione||[]).map(v=>{
        const sbloccata = V.leadModifica.has(v.id);
        const attiva = modificabile && sbloccata;
        return `<tr>
        <td><input type="text" data-lp-nome="${v.id}" value="${esc(v.nome)}" ${attiva?"":"disabled"}></td>
        <td><input type="number" class="num-cella" data-lp-valore="${v.id}" min="0" step="0.5" value="${v.valore}" ${attiva?"":"disabled"}></td>
        <td><select data-lp-unita="${v.id}" ${attiva?"":"disabled"}>
          <option value="settimane" ${v.unita!=="giorni"?"selected":""}>settimane</option>
          <option value="giorni" ${v.unita==="giorni"?"selected":""}>giorni</option></select></td>
        <td style="text-align:center"><input type="checkbox" data-lp-fornitura="${v.id}" ${v.richiedeFornitura!==false?"checked":""} ${attiva?"":"disabled"}
          title="${tr('Somma anche la fornitura esterna più lunga al calcolo della scadenza.')}"></td>
        <td style="text-align:right;white-space:nowrap">
          <button class="btn piccolo" data-modifica-prod="${v.id}">${sbloccata?tr("Fatto"):tr("Modifica")}</button>
          <button class="btn piccolo pericolo" data-del-prod="${v.id}">Elimina</button></td></tr>`;
      }).join("")
      || `<tr><td colspan="5" style="color:var(--tenue)">${tr('Nessuna tipologia: il tempo di sviluppo interno è considerato zero.')}</td></tr>`}
      <tr>
        <td><input type="text" id="lp-nome" placeholder="Descrizione" aria-label="Descrizione"></td>
        <td><input type="number" class="num-cella" id="lp-valore" min="0" step="0.5" placeholder="4" aria-label="Tempo"></td>
        <td><select id="lp-unita" aria-label="Giorni/settimane"><option value="settimane" selected>settimane</option><option value="giorni">giorni</option></select></td>
        <td style="text-align:center"><input type="checkbox" id="lp-fornitura" checked
          title="${tr('Somma anche la fornitura esterna più lunga al calcolo della scadenza.')}"></td>
        <td style="text-align:right"><button class="btn piccolo" id="lp-aggiungi">Aggiungi</button></td></tr>
      </tbody></table>
      <p class="aiuto" style="margin-top:6px">${tr('"Fornitura est." attiva: la scadenza di questa tipologia somma anche la fornitura esterna più lunga. Disattivala per le lavorazioni che non dipendono da fornitori esterni.')}</p>
    </div>
`;
  sez.protezione = `
    <div class="pannello">
      <h2 class="din">Protezione</h2>
      <p class="nota">${tr("Un codice richiesto prima di eliminare persone, progetti o gruppi, di togliere qualcuno dall'organico e di svuotare tutto. Serve contro il clic distratto: chi apre il file con un editor di testo lo aggira, quindi non usare un codice che usi anche altrove.")}</p>
      <p style="margin:10px 0">
        <span class="chip ${protetto()?"attiva":"archiviata"}" style="font-size:12px;padding:4px 10px">
          ${protetto() ? tr("Protezione attiva") : tr("Protezione non attiva")}</span>
        ${protetto()&&modificato?` <span class="chip sospesa" style="font-size:12px;padding:4px 10px">${tr("da salvare")}</span>`:""}
      </p>
      <div class="riga-campi" style="align-items:flex-end">
        <div class="campo"><label for="cfg-codice">${protetto() ? tr("Nuovo codice") : tr("Codice")}</label>
          <input type="password" id="cfg-codice" autocomplete="new-password" ${modificabile?"":"disabled"}></div>
        <div class="campo" style="flex:0 1 auto"><label>&nbsp;</label>
          <button class="btn primario" id="btn-codice" ${modificabile?"":"disabled"}>${protetto() ? tr("Cambia codice") : tr("Attiva protezione")}</button></div>
        ${protetto()?`<div class="campo" style="flex:0 1 auto"><label>&nbsp;</label>
          <button class="btn pericolo" id="btn-codice-off" ${modificabile?"":"disabled"}>Rimuovi protezione</button></div>`:""}
      </div>
      ${modificabile?"":`<p class="nota">${tr("Attiva la modifica in alto a destra per impostare il codice.")}</p>`}
      <h3>Azioni protette</h3>
      <table><tbody>
        <tr><td>${tr("Svuota tutto")}</td><td class="num-cella">${protetto()?"✓":"–"}</td></tr>
        <tr><td>${tr("Eliminare una persona")}</td><td class="num-cella">${protetto()?"✓":"–"}</td></tr>
        <tr><td>${tr("Eliminare un progetto")}</td><td class="num-cella">${protetto()?"✓":"–"}</td></tr>
        <tr><td>${tr("Eliminare un gruppo")}</td><td class="num-cella">${protetto()?"✓":"–"}</td></tr>
        <tr><td>${tr("Togliere una persona dall'organico")}</td><td class="num-cella">${protetto()?"✓":"–"}</td></tr>
        <tr><td>${tr("Eliminare una singola attività")}</td><td class="num-cella">${protetto()&&S.config.proteggiAttivita?"✓":"–"}</td></tr>
      </tbody></table>
      <div class="campo" style="margin-top:10px"><label class="spunta">
        <input type="checkbox" id="cfg-prot-att" ${S.config.proteggiAttivita?"checked":""} ${modificabile?"":"disabled"}>
        ${tr("Chiedi il codice anche per eliminare una singola attività")}</label>
        <span class="aiuto">${tr("È l'operazione più frequente: attivalo solo se serve davvero.")}</span></div>
    </div>
`;
  const cartelleAttive = RADICI.map(r=>`<tr><td class="mono">${esc(r.name)}</td>
      <td><span class="chip attiva">${tr("Collegata")}</span></td>
      <td style="text-align:right"><button class="btn piccolo pericolo" data-rimuovi-radice="${esc(r.name)}">${tr("Rimuovi")}</button></td></tr>`).join("");
  const cartelleSospese = RADICI_SOSPESE.map(r=>`<tr><td class="mono">${esc(r.name)}</td>
      <td><span class="chip sospesa">${tr("Da confermare")}</span></td>
      <td style="text-align:right;white-space:nowrap">
        <button class="btn piccolo" data-riprendi-radice="${esc(r.name)}">${tr("Riprendi")}</button>
        <button class="btn piccolo pericolo" data-dimentica-radice="${esc(r.name)}">${tr("Dimentica")}</button></td></tr>`).join("");
  sez.dati = `
    <div class="pannello">
      <h2 class="din">Cartelle collegate</h2>
      <p class="nota">${tr("Le cartelle archivio che contengono i progetti: da qui la cartella di ogni commessa si trova da sola in base al numero. Il collegamento vale per questa sessione; il browser lo ricorda e lo ripropone con un clic al prossimo avvio.")}</p>
      <table><thead><tr><th>${tr("Cartella")}</th><th>${tr("Stato")}</th><th></th></tr></thead><tbody>
        ${cartelleAttive}${cartelleSospese}
        ${(!RADICI.length && !RADICI_SOSPESE.length) ? `<tr><td colspan="3" style="color:var(--tenue)">${tr("Nessuna cartella collegata.")}</td></tr>` : ""}
      </tbody></table>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
        <button class="btn" id="btn-aggiungi-radice">${tr("Aggiungi cartella")}</button>
        ${RADICI_SOSPESE.length > 1 ? `<button class="btn" id="btn-riprendi-tutte-radici">${tr("Riprendi tutte ({0})", RADICI_SOSPESE.length)}</button>` : ""}
      </div>
    </div>
    <div class="pannello">
      <h2 class="din">Archiviazione automatica</h2>
      <p class="nota">I progetti chiusi restano nel calendario e nello storico, ma dopo un po' spariscono dalle ricerche
      per non appesantire l'elenco. Il conto parte dalla data di chiusura.</p>
      <div class="campo" style="max-width:300px"><label for="cfg-archivio">Archivia i chiusi dopo (giorni)</label>
        <input type="number" id="cfg-archivio" min="0" step="1" value="${S.config.giorniArchiviazione}">
        <span class="aiuto">All'apertura del file i progetti oltre soglia passano in archivio da soli. Metti 0 per disattivare.</span></div>
    </div>
    <div class="pannello">
      <h2 class="din">Dati</h2>
      <p class="nota">Il piano vive in un file <span class="mono">dati.js</span> accanto a questa pagina. Chi apre la pagina vede l'ultimo file salvato.
      Se il browser lo permette, ogni salvataggio tiene anche una copia della versione precedente in una sottocartella <span class="mono">backup</span>
      accanto a <span class="mono">dati.js</span> (le ultime ${MAX_BACKUP}, le più vecchie si scartano da sole) — un rimedio rapido se un salvataggio va storto.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
        <button class="btn" id="btn-csv">Esporta CSV</button>
        <button class="btn" id="btn-scarica">Scarica dati.js</button>
        <button class="btn pericolo" id="btn-svuota">Svuota tutto</button>
      </div>
      <p class="nota" style="margin-top:12px">${tr("Ultimo salvataggio: {0}", S.meta.salvatoIl ? new Date(S.meta.salvatoIl).toLocaleString(lingua==="it"?"it-IT":"en-GB") : tr("mai"))}${S.meta.salvatoDa?" · "+esc(S.meta.salvatoDa):""}</p>
    </div>`;
  sez.licenza = `
    <div class="pannello">
      <h2 class="din">Licenza</h2>
      <p class="nota">Versione <span class="mono">${esc(VERSIONE_APP)}</span></p>
      <p class="nota">Sviluppato da Paolo Cioli. Software libero, distribuito sotto
      GNU Affero General Public License, versione 3 (AGPL-3.0).
      Testo integrale anche nel file <span class="mono">LICENSE</span> nella cartella del programma.</p>
      <pre class="mono testo-file">${esc(TESTO_LICENZA_AGPL)}</pre>
    </div>`;

  if(!sez[V.sottoImp]) V.sottoImp = "calendario";
  const barra = Object.keys(SOTTO_IMP).map(k =>
    `<button class="sotto-scheda din" role="tab" data-sotto="${k}" aria-selected="${k===V.sottoImp}">${tr(SOTTO_IMP[k])}</button>`).join("");

  document.getElementById("pagina").innerHTML = `<div class="contenuto">
    <div class="sotto-schede" role="tablist">${barra}</div>
    ${sez[V.sottoImp]}
  </div>`;
}
