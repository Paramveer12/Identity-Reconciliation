import { AppDataSource } from "../db/datasource";
import { Contact } from "../entity/contact";
import { Repository } from "typeorm";

export class ContactService {
    private contactRepository: Repository<Contact>;

    constructor() {
        this.contactRepository = AppDataSource.getRepository(Contact);
    }

    async identifyContact(email?: string, phoneNumber?: string) {
        const existingContacts = await this.contactRepository.find({
            where: [
                { email: email },
                { phoneNumber: phoneNumber }
            ]
        });

        // no matching contacts, create new as primary
        if (existingContacts.length === 0) {
            const newContact = this.contactRepository.create({
                email,
                phoneNumber,
                linkPrecedence: "primary",
            });
            await this.contactRepository.save(newContact);
            return this.formatResponse(newContact, []);
        }

        //get exact contact if exists
        const exactContact = existingContacts.find(contact => contact.email === email && contact.phoneNumber === phoneNumber);

        var primaryContact = await this.getParent(existingContacts);
        var secondaryContacts = await this.contactRepository.find({
            where:
                { linkedId: primaryContact!.id }
        });

        if (exactContact != null && exactContact != undefined) {
            return this.formatResponse(primaryContact!, secondaryContacts);
        }

        const existingContactWithEmail = existingContacts.find(contact => contact.email === email);
        const existingContactWithPhone = existingContacts.find(contact => contact.phoneNumber === phoneNumber);

        // if existingContactWithEmail && existingContactWithPhone both exists that means there is no new info but the info is in different not linked contacts
        // so we need to link them
        if ((existingContactWithEmail != null && existingContactWithEmail != undefined) && (existingContactWithPhone != null && existingContactWithPhone != undefined)) {
            return await this.linkExistingContacts(existingContactWithEmail, primaryContact, existingContactWithPhone, secondaryContacts);
        }

        // there is new info and we need ot create new contact
        const newContact = this.contactRepository.create({
            email,
            phoneNumber,
            linkPrecedence: "secondary",
            linkedId: primaryContact!.id
        });
        await this.contactRepository.save(newContact);
        secondaryContacts.push(newContact)
        return this.formatResponse(primaryContact!, secondaryContacts);
    }

    private async linkExistingContacts(existingContactWithEmail: Contact, primaryContact: Contact, existingContactWithPhone: Contact, secondaryContacts: Contact[]) {
        // find second primary
        var secondPrimary = 0;
        if (existingContactWithEmail.linkPrecedence == "primary" && existingContactWithEmail.id != primaryContact!.id) {
            secondPrimary = existingContactWithEmail.id!;
        } else if (existingContactWithEmail.linkPrecedence == "secondary" && existingContactWithEmail.linkedId != primaryContact!.id) {
            secondPrimary = existingContactWithEmail.linkedId!;
        } else if (existingContactWithPhone.linkPrecedence == "primary" && existingContactWithPhone.id != primaryContact!.id) {
            secondPrimary = existingContactWithPhone.id!;
        } else if (existingContactWithPhone.linkPrecedence == "secondary" && existingContactWithPhone.linkedId != primaryContact!.id) {
            secondPrimary = existingContactWithPhone.linkedId!;
        }

        // if no second primary found, it means its already linked previously
        if (secondPrimary === 0) {
            return this.formatResponse(primaryContact!, secondaryContacts);
        }

        const secondaryPrimaryContact = await this.contactRepository.findOne({
            where: { id: secondPrimary }
        });

        //find true primary based on created_at and make the other one secondary
        var truePrimary = primaryContact;
        if (secondaryPrimaryContact!.createdAt > primaryContact!.createdAt) {
            secondaryPrimaryContact!.linkPrecedence = "secondary";
            secondaryPrimaryContact!.linkedId = primaryContact!.id;
            await this.contactRepository.save(secondaryPrimaryContact!);
            await this.contactRepository.update({ linkedId: secondaryPrimaryContact!.id }, { linkedId: primaryContact!.id });
        } else {
            primaryContact!.linkPrecedence = "secondary";
            primaryContact!.linkedId = secondaryPrimaryContact!.id;
            await this.contactRepository.save(primaryContact!);
            await this.contactRepository.update({ linkedId: primaryContact!.id }, { linkedId: secondaryPrimaryContact!.id });
            truePrimary = secondaryPrimaryContact!;
        }
        // get updated secondary contacts
        secondaryContacts = await this.contactRepository.find({
            where: { linkedId: truePrimary!.id }
        });
        return this.formatResponse(truePrimary!, secondaryContacts);
    }

    //find primary contact in existingContacts or fetch from db based on linked ID of first record
    private async getParent(existingContacts: Contact[]) {
        var primaryContact = existingContacts.find(contact => contact.linkPrecedence === "primary");
        if (primaryContact === null || primaryContact === undefined) {
            var dbPrimaryContact = await this.contactRepository.findOne({
                where: { id: existingContacts[0].linkedId }
            });
            primaryContact = dbPrimaryContact!;
        }
        return primaryContact;
    }

    private formatResponse(primaryContact: Contact, secondaryContacts: Contact[]) {
        const emails = Array.from(new Set(
            [primaryContact.email, ...secondaryContacts.map(contact => contact.email)]
                .filter(email => email)
        ));
        const phoneNumbers = Array.from(new Set(
            [primaryContact.phoneNumber, ...secondaryContacts.map(contact => contact.phoneNumber)]
                .filter(phoneNumber => phoneNumber)
        ));
        const secondaryContactIds = secondaryContacts.map(contact => contact.id);

        return {
            contact: {
                primaryContactId: primaryContact.id,
                emails,
                phoneNumbers,
                secondaryContactIds
            }
        };
    }
}
