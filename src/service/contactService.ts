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

        if (existingContacts.length === 0) {
            const newContact = this.contactRepository.create({
                email,
                phoneNumber,
                linkPrecedence: "primary",
            });
            await this.contactRepository.save(newContact);
            return this.formatResponse(newContact, []);
        }

        const existingContact = existingContacts.find(contact => contact.email === email && contact.phoneNumber === phoneNumber);
        var primaryContact = existingContacts.find(contact => contact.linkPrecedence === "primary");
        if (primaryContact === null || primaryContact === undefined) {
            var dbPrimaryContact = await this.contactRepository.findOne({
                where:
                    { id: existingContacts[0].linkedId}
            });
            primaryContact = dbPrimaryContact!
        }
        var secondaryContacts = await this.contactRepository.find({
            where:
                { linkedId: primaryContact!.id }
        });

        if (existingContact != null && existingContact != undefined) {
            return this.formatResponse(primaryContact!, secondaryContacts);
        }

        const existingContactWithEmail = existingContacts.find(contact => contact.email === email);
        const existingContactWithPhone = existingContacts.find(contact => contact.phoneNumber === phoneNumber);

        if ((existingContactWithEmail != null && existingContactWithEmail != undefined) && (existingContactWithPhone != null && existingContactWithPhone != undefined)) {
            var secondaryPrimary = ""
            if (existingContactWithEmail.linkPrecedence == "primary" && existingContactWithEmail.id != primaryContact!.id) {
                secondaryPrimary = existingContactWithEmail.id!
            } else if (existingContactWithEmail.linkPrecedence == "secondary" && existingContactWithEmail.linkedId != primaryContact!.id) {
                secondaryPrimary = existingContactWithEmail.linkedId!
            } else if (existingContactWithPhone.linkPrecedence == "primary" && existingContactWithPhone.id != primaryContact!.id) {
                secondaryPrimary = existingContactWithPhone.id!
            } else if (existingContactWithPhone.linkPrecedence == "secondary" && existingContactWithPhone.linkedId != primaryContact!.id) {
                secondaryPrimary = existingContactWithPhone.linkedId!
            }

            const secondaryPrimaryContact = await this.contactRepository.findOne({
                where:
                    { id: secondaryPrimary }
            });
            var truePrimary = primaryContact
            if (secondaryPrimaryContact!.createdAt > primaryContact!.createdAt) {
                secondaryPrimaryContact!.linkPrecedence = "secondary"
                secondaryPrimaryContact!.linkedId = primaryContact!.id
                await this.contactRepository.save(secondaryPrimaryContact!);
                await this.contactRepository.update({ linkedId: secondaryPrimaryContact!.id }, { linkedId: primaryContact!.id });
            } else {
                primaryContact!.linkPrecedence = "secondary"
                primaryContact!.linkedId = secondaryPrimaryContact!.id
                await this.contactRepository.save(primaryContact!);
                await this.contactRepository.update({ linkedId: primaryContact!.id }, { linkedId: secondaryPrimaryContact!.id });
                truePrimary = secondaryPrimaryContact!
            }
            secondaryContacts = await this.contactRepository.find({
                where:
                    { linkedId: truePrimary!.id }
            });
            return this.formatResponse(truePrimary!, secondaryContacts);
        }

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
